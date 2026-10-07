import { cookieName, resolveVariant } from "@evinvest/experiments";
import type { MessengerFacts, MessengerVariant } from "@evinvest/kitstart";
import { EXPERIMENTS, type ExperimentKey, LEAD_FORMS, type LiveExperiments, MESSENGER_ARMS, QA_COOKIE, type VariantOf } from "@/shared/config/experiments";
import type { LeadForm } from "@/shared/config/lead";

/** Every experiment's variant, the control where nothing else applies. */
export type Assignment = { [K in ExperimentKey]: VariantOf<K> };

/**
 * The experiments a render runs and the variant of each. An experiment that
 * is absent is not running for that page: it renders the control and sends
 * nothing.
 */
export type Bucket = Partial<Assignment>;

const KEYS = Object.keys(EXPERIMENTS) as ExperimentKey[];
const MARK = "~";

const control = (key: ExperimentKey): VariantOf<typeof key> => EXPERIMENTS[key].variants[0];

/** The control everywhere: a bot's page, a page where no test runs. */
export const CONTROL: Assignment = Object.fromEntries(KEYS.map(k => [k, control(k)])) as Assignment;

/** What a page renders: the bucket's variants, the control for the rest. */
export function variantsOf(bucket: Bucket): Assignment {
  return { ...CONTROL, ...bucket };
}

/** What the quote card draws for a bucket, and the one assignment its own events and post carry. */
export interface CardArms {
  form: LeadForm;
  /** `lead_channel`'s variant; `undefined` → the control. */
  messenger: MessengerVariant | undefined;
  experiment: { name: ExperimentKey; variant: string } | undefined;
}

/**
 * The card's arms (MESSENGER-CHANNELS-SPEC §4, precedence): a `lead_channel`
 * arm that draws a messenger wins — the compact form under it, whatever
 * `lead_form` says, and the card's events (kitstart's `experiment`, one per
 * card) name `lead_channel`. On a place that offers no messenger every arm of
 * it is the control, so it changes nothing there: `lead_form` keeps the form
 * and the events, and a visitor's `lead_form` arm is not overruled for nothing.
 */
export function cardArms(bucket: Bucket, messengers: MessengerFacts): CardArms {
  const { lead_form: form, lead_channel: channel } = variantsOf(bucket);
  const messenger = bucket.lead_channel === undefined ? undefined : MESSENGER_ARMS[channel];
  if (messenger !== undefined && (messengers.whatsapp !== null || messengers.telegram !== null)) {
    return { form: LEAD_FORMS.a, messenger, experiment: { name: "lead_channel", variant: channel } };
  }
  return { form: LEAD_FORMS[form], messenger: undefined, experiment: bucket.lead_form === undefined ? undefined : { name: "lead_form", variant: form } };
}

/**
 * The bucket as a suffix of the `[location]` param: `~lead_form.a~booking_provider.b`,
 * one `~key.variant` per experiment the visitor runs, the control spelt out,
 * in config order. Whether a test runs is in the path, not read by the page:
 * the panel can switch one off at any moment, and a cached page must not go
 * on counting it. The page stays ISR — each bucket is its own cache entry.
 * No suffix is the frame's page with no test running, the one bots get.
 */
export function bucketSuffix(bucket: Bucket): string {
  return KEYS.filter(k => bucket[k] !== undefined)
    .map(k => `${MARK}${k}.${bucket[k]}`)
    .join("");
}

const isVariant = (key: ExperimentKey, raw: string): boolean => (EXPERIMENTS[key].variants as readonly string[]).includes(raw);

/**
 * Inverse of {@link bucketSuffix} on a `[location]` param. Only the code's
 * keys and variants are checked — they never change without a deploy, so
 * the page needs no panel to read its own path. `null` when the suffix is not
 * one the proxy writes (unknown key or variant, a key twice, another order):
 * such a path is not a cache entry of ours.
 */
export function parseLocation(param: string): { place: string; bucket: Bucket } | null {
  const [place = "", ...parts] = param.split(MARK);
  const bucket: Record<string, string> = {};
  for (const part of parts) {
    const [key = "", variant = ""] = part.split(".");
    if (!(KEYS as string[]).includes(key) || !isVariant(key as ExperimentKey, variant)) return null;
    bucket[key] = variant;
  }
  const parsed = bucket as Bucket;
  return bucketSuffix(parsed) === param.slice(place.length) ? { place, bucket: parsed } : null;
}

/** The place param alone, for the place loader; a malformed suffix stays and 404s there. */
export function placeOfLocation(param: string): string {
  return parseLocation(param)?.place ?? param;
}

/** The bucket without the experiments `live` has switched off. */
export function runningOf(live: LiveExperiments, bucket: Bucket): Bucket {
  return Object.fromEntries(Object.entries(bucket).filter(([k]) => live[k as ExperimentKey].enabled !== false)) as Bucket;
}

/**
 * The visitor's assignment as the `ab_<key>` cookies record it, under the
 * live config — only the experiments it runs now that the visitor was
 * actually assigned to, so a request with no cookie (a bot, a crawler, a
 * stale form) is in no experiment, and a cookie of a switched-off one counts
 * for nothing.
 */
export function assignedBy(live: LiveExperiments, cookie: (name: string) => string | undefined): { assigned: Bucket; forced: boolean } {
  const assigned: Record<string, string> = {};
  for (const key of KEYS) {
    const raw = cookie(cookieName(key));
    if (live[key].enabled !== false && raw !== undefined) assigned[key] = resolveVariant(live, key, raw);
  }
  return { assigned: assigned as Bucket, forced: cookie(QA_COOKIE) === "1" };
}

/** The experiments `live` has switched off (paused): their visitors keep their arms. */
export function pausedOf(live: LiveExperiments): ExperimentKey[] {
  return KEYS.filter(key => live[key].enabled === false);
}

/**
 * Crawlers and link previews: always the control, and no cookie, so they are
 * never an exposure. `HeadlessChrome` is not here — it is the e2e browser.
 */
const BOT = /bot\b|bot\/|crawler|spider|slurp|preview|facebookexternalhit|lighthouse|pagespeed/i;

export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT.test(userAgent);
}
