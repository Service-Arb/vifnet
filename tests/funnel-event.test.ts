import { createHmac } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Lead } from "@evinvest/kitstart";
import { leadWebhook, parseServerEnv, type LeadWebhookContext } from "@evinvest/kitstart/server";
import { afterEach, describe, expect, it } from "vitest";
import { site } from "@/shared/config/site";
import { isOpaqueId, leadCreatedBody, SA_INGEST_SIGNING, uuidV7 } from "@/shared/lib/funnel-event";

const lead: Lead = {
  subject: "deep",
  locality: "10001",
  mobile: "(212) 555-0147",
  extras: { name: "Jane Doe", bedrooms: "3" },
  placeSlug: "vifnet",
  spamVerdict: null,
};

const ctx: LeadWebhookContext = {
  leadId: 42,
  brandId: "vifnet",
  locale: "en",
  formId: "quote",
  at: new Date("2026-10-01T09:30:00.123Z"),
  idempotencyKey: "0b5c1f0e-7d1a-4e8b-9c2d-3f4a5b6c7d8e",
};

/** The proto3 JSON names of each message's fields, read from the panel's contract. */
function protoFields(): Map<string, Set<string>> {
  const proto = readFileSync(new URL("./support/sa-events.proto", import.meta.url), "utf8");
  const messages = new Map<string, Set<string>>();
  for (const [, name, body] of proto.matchAll(/^message (\w+) \{([^}]*)\}/gm)) {
    const fields = new Set<string>();
    for (const [, field] of (body ?? "").matchAll(/^\s*(?:optional |repeated )?[\w.]+ (\w+) = \d+;/gm)) {
      fields.add((field ?? "").replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()));
    }
    messages.set(name ?? "", fields);
  }
  return messages;
}

const keysWithin = (value: object, message: string): void => {
  const allowed = protoFields().get(message);
  expect(allowed, message).toBeDefined();
  for (const key of Object.keys(value)) expect(allowed, `${message}.${key}`).toContain(key);
};

describe("lead.created for the panel", () => {
  it("builds one sa.funnel.v1 event from a lead", () => {
    const body = leadCreatedBody(lead, ctx, "vifnet-site");
    expect(body).toEqual({
      events: [
        {
          id: uuidV7(ctx.at, ctx.idempotencyKey),
          schema: "sa.funnel.v1",
          type: "lead.created",
          typeVersion: 1,
          occurredAt: "2026-10-01T09:30:00.123Z",
          source: { kind: "site", id: "vifnet-site" },
          subject: { brandId: "vifnet", locationId: "vifnet", leadId: "lead-42" },
          properties: { channel: "form" },
          pii: { name: "Jane Doe", bedrooms: "3", phone: "(212) 555-0147", need: "deep", locality: "10001" },
        },
      ],
    });
  });

  it("names only fields the proto declares, in their protojson spelling", () => {
    const body = leadCreatedBody(lead, ctx, "vifnet-site");
    keysWithin(body, "IngestRequest");
    const [event] = body.events;
    keysWithin(event, "Event");
    keysWithin(event.source, "Source");
    keysWithin(event.subject, "Subject");
    // The panel checks registered properties strictly: an unknown field rejects the event.
    keysWithin(event.properties, "LeadCreatedV1");
  });

  it("meets the panel's checks on the envelope", () => {
    const [event] = leadCreatedBody(lead, ctx, "vifnet-site").events;
    expect(event.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(event.occurredAt).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z$/);
    expect(event.subject.brandId).toMatch(/^[a-z0-9][a-z0-9_-]{0,63}$/);
    expect(isOpaqueId(event.subject.leadId)).toBe(true);
    expect(isOpaqueId(event.subject.locationId ?? "")).toBe(true);
  });

  it("keeps a UUIDv7's time in its first 48 bits and is a function of the context", () => {
    const id = uuidV7(ctx.at, ctx.idempotencyKey);
    expect(Number.parseInt(id.replaceAll("-", "").slice(0, 12), 16)).toBe(ctx.at.getTime());
    expect(uuidV7(ctx.at, ctx.idempotencyKey)).toBe(id);
    expect(uuidV7(ctx.at, "another key")).not.toBe(id);
  });

  it("keeps what the customer typed out of properties, and NUL out of everything", () => {
    const [event] = leadCreatedBody({ ...lead, mobile: "212\u0000555", subject: "move", locality: "", extras: { name: "Jane\u0000" } }, ctx, "vifnet-site").events;
    expect(event.properties).toEqual({ channel: "form" });
    expect(event.pii).toEqual({ name: "Jane", phone: "212555", need: "move" });
    expect(JSON.stringify(event)).not.toContain("\\u0000");
  });

  it("leaves the location out for a lead from no point", () => {
    const [event] = leadCreatedBody({ ...lead, placeSlug: null }, ctx, "vifnet-site").events;
    expect(event.subject).toEqual({ brandId: "vifnet", leadId: "lead-42" });
  });

  it("refuses ids the panel takes for phone numbers", () => {
    expect(isOpaqueId("lead-1234567")).toBe(true);
    expect(isOpaqueId("1234567")).toBe(false);
    expect(isOpaqueId("06.12.34.56.78")).toBe(false);
    expect(isOpaqueId("+33612345678")).toBe(false);
  });

  it("gives every point a slug the panel accepts as a location id", () => {
    for (const slug of site.placeSlugs) expect(isOpaqueId(slug), slug).toBe(true);
  });
});

describe("the lead webhook, wired as the site wires it", () => {
  let dir: string | undefined;
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
    dir = undefined;
  });

  it("is off without LEAD_WEBHOOK_URL", () => {
    dir = mkdtempSync(join(tmpdir(), "vifnet-hook-"));
    const env = parseServerEnv(site, { LEADS_DB_PATH: join(dir, "leads.db") });
    expect(env.leadWebhook).toBeNull();
  });

  it("posts the event signed the way the panel verifies it", async () => {
    dir = mkdtempSync(join(tmpdir(), "vifnet-hook-"));
    const env = parseServerEnv(site, {
      LEADS_DB_PATH: join(dir, "leads.db"),
      LEAD_WEBHOOK_URL: "http://127.0.0.1:59120/api/ingest/v1/events",
      LEAD_WEBHOOK_KEY_ID: "vifnet-site",
      LEAD_WEBHOOK_SECRET: "test-secret",
    });
    const target = env.leadWebhook;
    if (!target) throw new Error("the webhook should be on");
    const sent: Request[] = [];
    const hook = leadWebhook(site, env, {
      signing: SA_INGEST_SIGNING,
      buildBody: (l, c) => leadCreatedBody(l, c, target.keyId),
      fetch: async (input, init) => {
        sent.push(new Request(input, init));
        return new Response(JSON.stringify({ results: [{ index: 0, status: "accepted" }] }), { status: 207 });
      },
      log: { info: () => {}, warn: () => {}, error: () => {} },
    });
    if (!hook) throw new Error("the webhook should be on");
    try {
      hook.enqueue(lead, 7, { locale: "en", formId: "quote" });
      expect(await hook.tick()).toMatchObject({ delivered: 1 });
    } finally {
      hook.close();
    }

    const [request] = sent;
    if (!request) throw new Error("nothing was sent");
    const raw = await request.text();
    const timestamp = request.headers.get("x-sa-timestamp") ?? "";
    expect(request.headers.get("x-sa-key-id")).toBe("vifnet-site");
    expect(request.headers.get("x-sa-signature")).toBe(
      createHmac("sha256", "test-secret").update(`sa-ingest/v1.${timestamp}.${raw}`).digest("hex"),
    );
    const body: unknown = JSON.parse(raw);
    // An array in toMatchObject must match in length: one event, no more.
    expect(body).toMatchObject({
      events: [
        {
          source: { kind: "site", id: "vifnet-site" },
          subject: { brandId: "vifnet", locationId: "vifnet", leadId: "lead-7" },
        },
      ],
    });
  });
});
