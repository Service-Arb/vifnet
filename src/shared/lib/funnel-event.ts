import "server-only";
import { createHash } from "node:crypto";
import { channelOf, type Lead, type LeadSuspect } from "@evinvest/kitstart";
import {
  panelChannel,
  panelFlowProperties,
  type LeadWebhookContext,
  type LeadWebhookOptions,
  type PanelFlowProperties,
  type WebhookSigning,
} from "@evinvest/kitstart/server";
import { isSubject, PANEL_NEED } from "@/shared/config/lead";

/**
 * The panel's ingest scheme (Service-Arb/panel README, "Sending events"): the
 * MAC covers `sa-ingest/v1.<timestamp>.<body>`.
 */
export const SA_INGEST_SIGNING: WebhookSigning = {
  prefix: "sa-ingest/v1.",
  headers: { keyId: "x-sa-key-id", timestamp: "x-sa-timestamp", signature: "x-sa-signature" },
};

/**
 * Whether a suspect lead goes to the panel marked (`suspect`) — and a
 * rate-limited one goes at all. Off until the panel's `lead.created` accepts
 * the property: it refuses an unknown one, and the outbox would park the lead.
 */
export const PANEL_SUSPECT = false;

/**
 * Whether a lead goes to the panel with how it was sold — `flow`, and for an
 * estimate `quoted_cents`, `pricing_valid_from` and `estimate_inputs` (the
 * contract of FORM-VARIANTS-SPEC.md, "Contract amendments"). Off until the
 * panel in production accepts them: it refuses unknown properties, and the
 * outbox would park the lead.
 */
export const PANEL_FLOW = false;

/**
 * `lead.created@1` as protojson — `sa.v1.Event` with `LeadCreatedV1` for
 * properties (Service-Arb/panel `contracts/proto/sa/v1/events.proto`).
 */
export interface LeadCreatedEvent {
  id: string;
  schema: "sa.funnel.v1";
  type: "lead.created";
  typeVersion: 1;
  occurredAt: string;
  source: { kind: "site"; id: string };
  subject: { brandId: string; locationId?: string; leadId: string };
  /**
   * `channel` is the panel's closed set: a callback travels as `form` until it
   * accepts `callback` (`panelChannel`). `suspect` only when the kit sets
   * `ctx.suspect`, which it does only under `PANEL_SUSPECT`: `rate_limited` or
   * `too_fast`, never `honeypot`. The sale's properties only when the kit sets
   * `ctx.flow`, which it does only under `PANEL_FLOW`.
   */
  properties: { channel: ReturnType<typeof panelChannel>; suspect?: LeadSuspect } & Partial<PanelFlowProperties>;
  pii?: Record<string, string>;
}

/** `sa.v1.IngestRequest`. */
export interface IngestBody {
  events: [LeadCreatedEvent];
}

/**
 * The panel's `is_opaque` (panel_core/src/ids.rs): an id is stored in the
 * clear, so one that could be a phone number — only digits, dots and dashes,
 * seven digits or more — is refused.
 */
export function isOpaqueId(s: string): boolean {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(s)) return false;
  const phoneLike = /^[0-9.-]+$/.test(s) && (s.match(/[0-9]/g)?.length ?? 0) >= 7;
  return !phoneLike;
}

/**
 * A UUIDv7 for the event: the panel refuses any other version, and the kit's
 * `idempotencyKey` is a v4. The time is when the lead was accepted and the
 * random bits are hashed from the key, so the id is a pure function of `ctx`
 * — not that it matters for retries (the outbox stores the built body), but a
 * test can pin it.
 */
export function uuidV7(at: Date, seed: string): string {
  const bytes = createHash("sha256").update(seed).digest().subarray(0, 16);
  let ms = at.getTime();
  for (let i = 5; i >= 0; i--) {
    bytes[i] = ms % 256;
    ms = Math.floor(ms / 256);
  }
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = bytes.toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// Postgres cannot hold U+0000, and the panel rejects the event that carries one.
const clean = (s: string): string => s.replaceAll("\u0000", "");

/**
 * What the customer typed, kept apart from `properties`: the panel seals
 * `pii` and reads `name`, `phone` and `need` from it. `need` is the job in the
 * operator's words (`PANEL_NEED`), or as posted when it is none of ours — a
 * stale page's value is still what the customer asked for. The fields are capped by
 * the lead schema (200 characters, an extra its own `max`), far below the
 * panel's 16 KiB. A callback's consent stays in the leads file: the panel's
 * contract has no field for it.
 */
function piiOf(lead: Lead): Record<string, string> {
  const pii: Record<string, string> = {};
  const put = (key: string, value: string): void => {
    const v = clean(value).trim();
    if (v !== "") pii[key] = v;
  };
  for (const [name, value] of Object.entries(lead.extras)) put(name, value);
  put("phone", lead.mobile);
  put("need", isSubject(lead.subject) ? PANEL_NEED[lead.subject] : lead.subject);
  put("locality", lead.locality);
  return pii;
}

/**
 * The lead's id for the panel: the row id, for a person matching it to the
 * mail, plus 8 hex of the kit's per-lead key — row ids start over if the
 * leads file is ever recreated, and the panel counts only the first
 * `lead.created` of a lead id. The letter prefix keeps it from looking like a
 * phone number to the panel.
 */
export function panelLeadId(ctx: Pick<LeadWebhookContext, "leadId" | "idempotencyKey">): string {
  const tag = createHash("sha256").update(ctx.idempotencyKey).digest("hex").slice(0, 8);
  return `lead-${ctx.leadId}-${tag}`;
}

/**
 * The webhook body for one lead. `sourceId` is the key id the batch is signed
 * with — the panel rejects an event whose `source.id` is anything else.
 * `locationId` is the point the form was posted from (its slug, which is its
 * subdomain); a lead from no point carries none.
 */
export function leadCreatedBody(lead: Lead, ctx: LeadWebhookContext, sourceId: string): IngestBody {
  const subject: LeadCreatedEvent["subject"] = { brandId: ctx.brandId, leadId: panelLeadId(ctx) };
  if (lead.placeSlug !== null && isOpaqueId(lead.placeSlug)) subject.locationId = lead.placeSlug;
  const event: LeadCreatedEvent = {
    id: uuidV7(ctx.at, ctx.idempotencyKey),
    schema: "sa.funnel.v1",
    type: "lead.created",
    typeVersion: 1,
    occurredAt: ctx.at.toISOString(),
    source: { kind: "site", id: sourceId },
    subject,
    properties: { channel: panelChannel(channelOf(lead)) },
  };
  if (ctx.suspect !== undefined) event.properties.suspect = ctx.suspect;
  Object.assign(event.properties, panelFlowProperties(ctx.flow));
  const pii = piiOf(lead);
  if (Object.keys(pii).length > 0) event.pii = pii;
  return { events: [event] };
}

/**
 * The site's options for kitstart's `leadWebhook`: the panel's signing, this
 * body, and the suspect and sale switches. `keyId` is the key the batch is
 * signed with; `switches` is for a test that turns one on.
 */
export function panelWebhookOptions(
  keyId: string,
  switches: { panelSuspect: boolean; panelFlow: boolean } = { panelSuspect: PANEL_SUSPECT, panelFlow: PANEL_FLOW },
): Pick<LeadWebhookOptions, "signing" | "buildBody" | "panelSuspect" | "panelFlow"> {
  return { signing: SA_INGEST_SIGNING, buildBody: (lead, ctx) => leadCreatedBody(lead, ctx, keyId), ...switches };
}
