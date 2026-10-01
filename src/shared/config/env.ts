import "server-only";
import {
  createPlaceSource,
  createServerEnv,
  leadNotifier,
  leadWebhook,
  type LeadNotifier,
  type LeadWebhook,
} from "@evinvest/kitstart/server";
import { leadCreatedBody, SA_INGEST_SIGNING } from "@/shared/lib/funnel-event";
import { site } from "./site";

/** Parsed once, lazily: `next build` imports this and must need no secrets. */
export const serverEnv = createServerEnv(site);

/** The live place data, when `LOCATIONS_API_URL` is set; baked otherwise. */
export const places = createPlaceSource(site, { baseUrl: () => serverEnv().locationsApiUrl });

let built: LeadNotifier | undefined;

/** Built at boot (`instrumentation.ts`), so SMTP with no sender fails startup. */
export function notifier(): LeadNotifier {
  built ??= leadNotifier(site, serverEnv());
  return built;
}

let hook: LeadWebhook | null | undefined;

/**
 * Each lead as `lead.created` to the Service-Arb panel, through the outbox in
 * the leads file; `null` without `LEAD_WEBHOOK_URL`. With it,
 * `LEAD_WEBHOOK_KEY_ID` and `LEAD_WEBHOOK_SECRET` are required — checked at
 * boot (`instrumentation.ts`).
 */
export function webhook(): LeadWebhook | null {
  if (hook !== undefined) return hook;
  const env = serverEnv();
  const target = env.leadWebhook;
  hook =
    target === null
      ? null
      : leadWebhook(site, env, {
          signing: SA_INGEST_SIGNING,
          buildBody: (lead, ctx) => leadCreatedBody(lead, ctx, target.keyId),
        });
  return hook;
}
