import "server-only";
import { createHash } from "node:crypto";
import { bookingRequestedProperties, channelOf, leadRef, type BookingRequest, type BookingRequestedProperties, type Lead, type LeadSuspect } from "@evinvest/kitstart";
import {
  panelChannel,
  panelFlowProperties,
  type BookingWebhookContext,
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
 * rate-limited one goes at all. On since the panel's `lead.created` accepts
 * the property (panel v0.3.0): off, the panel would never see a lead the
 * antispam doubted, which may still be a person.
 */
export const PANEL_SUSPECT = true;

/**
 * Whether a lead goes to the panel with how it was sold — `flow`, and for an
 * estimate `quoted_cents`, `pricing_valid_from` and `estimate_inputs` (the
 * contract of FORM-VARIANTS-SPEC.md, "Contract amendments"). On since the
 * panel accepts them (v0.3.0, `LeadCreatedV1` fields 4–7).
 */
export const PANEL_FLOW = true;

/**
 * Whether a priced lead's booking request goes to the panel as
 * `booking.requested@1` (`/quote/booking`, after the lead's `lead.created`).
 * Off until the panel accepts the event type: it refuses an unknown one, and
 * the outbox would park the request. Off, the route answers and drops it.
 */
export const PANEL_BOOKING = false;

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

/**
 * `booking.requested@1` (FORM-VARIANTS-SPEC, "Booking amendments" 3): the
 * site's word that a priced lead asked for a slot. `subject.leadId` is the
 * lead's `leadRef`, the id its `lead.created` carried, so the two join. No
 * `pii`: the properties are slugs and a date, nothing a person typed.
 */
export interface BookingRequestedEvent {
  id: string;
  schema: "sa.funnel.v1";
  type: "booking.requested";
  typeVersion: 1;
  occurredAt: string;
  source: { kind: "site"; id: string };
  subject: { brandId: string; leadId: string };
  properties: BookingRequestedProperties;
}

/** `sa.v1.IngestRequest`: one event per body, as the outbox sends one row at a time. */
export interface IngestBody<E = LeadCreatedEvent> {
  events: [E];
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
 * The lead's id for the panel: kitstart's `leadRef` (`lead-<row>-<8 hex>`),
 * the reference the page was answered with. A booking names its lead by it
 * (`booking.requested`'s `lead_ref`, a booking page's `ref`), so `lead.created`
 * must carry the same one or the two never join. The kit sets it on every
 * lead it queues; a context built by hand has none, and gets the kit's own
 * derivation from the row and the per-lead key — the same shape, no join.
 */
export function panelLeadId(ctx: Pick<LeadWebhookContext, "leadId" | "idempotencyKey" | "leadRef">): string {
  return ctx.leadRef ?? leadRef(ctx.leadId, ctx.idempotencyKey);
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

/** The webhook body for one booking request, signed like a lead's (`sourceId`). */
export function bookingRequestedBody(request: BookingRequest, ctx: BookingWebhookContext, sourceId: string): IngestBody<BookingRequestedEvent> {
  return {
    events: [
      {
        id: uuidV7(ctx.at, ctx.idempotencyKey),
        schema: "sa.funnel.v1",
        type: "booking.requested",
        typeVersion: 1,
        occurredAt: ctx.at.toISOString(),
        source: { kind: "site", id: sourceId },
        subject: { brandId: ctx.brandId, leadId: request.leadRef },
        properties: bookingRequestedProperties(request),
      },
    ],
  };
}

/** The panel's switches: each stays off until the panel in production accepts what it adds — it refuses the unknown. */
export interface PanelSwitches {
  panelSuspect: boolean;
  panelFlow: boolean;
  panelBooking: boolean;
}

export const PANEL_SWITCHES: PanelSwitches = { panelSuspect: PANEL_SUSPECT, panelFlow: PANEL_FLOW, panelBooking: PANEL_BOOKING };

/**
 * The site's options for kitstart's `leadWebhook`: the panel's signing, the
 * two bodies, and the switches. The booking body is always wired, so turning
 * `PANEL_BOOKING` on is the one change. `keyId` is the key the batch is signed
 * with; `switches` is for a test that turns one on.
 */
export function panelWebhookOptions(
  keyId: string,
  switches: Partial<PanelSwitches> = {},
): Pick<LeadWebhookOptions, "signing" | "buildBody" | "buildBookingBody" | "panelSuspect" | "panelFlow" | "panelBooking"> {
  return {
    signing: SA_INGEST_SIGNING,
    buildBody: (lead, ctx) => leadCreatedBody(lead, ctx, keyId),
    buildBookingBody: (request, ctx) => bookingRequestedBody(request, ctx, keyId),
    ...PANEL_SWITCHES,
    ...switches,
  };
}
