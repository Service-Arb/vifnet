import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isLeadRef, MIN_FILL_MS } from "@evinvest/kitstart";
import { quoteRoute } from "@evinvest/kitstart/next";
import { leadNotifier, leadWebhook, parseServerEnv, type LeadWebhook } from "@evinvest/kitstart/server";
import { afterEach, describe, expect, it } from "vitest";
import { site } from "@/shared/config/site";
import { panelWebhookOptions } from "@/shared/lib/funnel-event";

/**
 * The join a booking depends on, through the real route: the reference the
 * page is answered with is the lead id the panel receives in `lead.created`.
 */
describe("a lead's reference, from the page to the panel", () => {
  let dir: string | undefined;
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
    dir = undefined;
  });

  it("is the same on the script's answer and in lead.created", async () => {
    dir = mkdtempSync(join(tmpdir(), "vifnet-ref-"));
    const env = parseServerEnv(site, {
      LEADS_DB_PATH: join(dir, "leads.db"),
      LEAD_WEBHOOK_URL: "http://127.0.0.1:59120/api/ingest/v1/events",
      LEAD_WEBHOOK_KEY_ID: "vifnet-site",
      LEAD_WEBHOOK_SECRET: "test-secret",
    });
    const bodies: unknown[] = [];
    const hook: LeadWebhook | null = leadWebhook(site, env, {
      ...panelWebhookOptions("vifnet-site"),
      fetch: async (input, init) => {
        bodies.push(JSON.parse(await new Request(input, init).text()));
        return new Response(JSON.stringify({ results: [{ index: 0, status: "accepted" }] }), { status: 207 });
      },
      log: { info: () => {}, warn: () => {}, error: () => {} },
    });
    if (!hook) throw new Error("the webhook should be on");

    const renderedAt = Date.UTC(2026, 9, 4, 9);
    const deferred: Promise<void>[] = [];
    const post = quoteRoute(site, {
      env: () => env,
      notifier: () => leadNotifier(site, env),
      webhook: () => hook,
      defer: task => void deferred.push(Promise.resolve(task())),
      now: () => renderedAt + MIN_FILL_MS + 5_000,
      unavailable: () => ({ title: "", heading: "", body: "", callLabel: "" }),
    });
    const form = new FormData();
    for (const [k, v] of Object.entries({
      subject: "deep",
      locality: "75015",
      mobile: "06 12 34 56 78",
      name: "Amanda Reyes",
      location: "vifnet",
      locale: "fr",
      form_id: "quote",
      submission_id: "3f2b7c1e-8a4d-4e6f-9b0a-1c2d3e4f5a6b",
      t: String(renderedAt),
    })) {
      form.set(k, v);
    }
    try {
      const response = await post(new Request("http://localhost/quote", { method: "POST", body: form, headers: { accept: "application/json" } }));
      expect(response.status).toBe(200);
      const answer = (await response.json()) as { ok: boolean; lead?: unknown };
      expect(answer.ok).toBe(true);
      expect(isLeadRef(answer.lead)).toBe(true);

      await Promise.all(deferred);
      await hook.tick();
      expect(bodies).toEqual([{ events: [expect.objectContaining({ subject: expect.objectContaining({ leadId: answer.lead }) })] }]);
    } finally {
      hook.close();
    }
  });
});
