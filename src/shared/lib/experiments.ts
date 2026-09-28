import { cookieName, resolveVariant } from "@evinvest/experiments";
import { EXPERIMENTS, type ExperimentKey, QA_COOKIE, type VariantOf } from "@/shared/config/experiments";

/** Every experiment's variant, the control where nothing else applies. */
export type Assignment = { [K in ExperimentKey]: VariantOf<K> };

const KEYS = Object.keys(EXPERIMENTS) as ExperimentKey[];
const MARK = "~";

const control = (key: ExperimentKey): VariantOf<typeof key> => EXPERIMENTS[key].variants[0];
const enabled = (key: ExperimentKey): boolean => (EXPERIMENTS[key] as { enabled?: boolean }).enabled !== false;

/** The control everywhere: a bot's page, a disabled test's, a place param with no suffix. */
export const CONTROL: Assignment = Object.fromEntries(KEYS.map(k => [k, control(k)])) as Assignment;

/**
 * The bucket as a suffix of the `[location]` param: `~quote_single_step.b`,
 * one `~key.variant` per enabled experiment off its control, in config order.
 * The page stays ISR — each bucket is its own cache entry, and the page never
 * reads the request. All-control is no suffix: that entry is the frame's page,
 * the one bots and a disabled test share.
 */
export function bucketSuffix(assignment: Assignment): string {
  return KEYS.filter(k => enabled(k) && assignment[k] !== control(k))
    .map(k => `${MARK}${k}.${assignment[k]}`)
    .join("");
}

/**
 * Inverse of {@link bucketSuffix} on a `[location]` param. `null` when the
 * suffix is not one the proxy writes (unknown key or variant, a control spelt
 * out, another order): such a path is not a cache entry of ours.
 */
export function parseLocation(param: string): { place: string; assignment: Assignment } | null {
  const [place = "", ...parts] = param.split(MARK);
  const assignment: Record<string, string> = { ...CONTROL };
  for (const part of parts) {
    const [key = "", variant = ""] = part.split(".");
    if (!(KEYS as string[]).includes(key)) return null;
    assignment[key] = resolveVariant(EXPERIMENTS, key as ExperimentKey, variant);
  }
  const parsed = assignment as Assignment;
  return bucketSuffix(parsed) === param.slice(place.length) ? { place, assignment: parsed } : null;
}

/** The place param alone, for the place loader; a malformed suffix stays and 404s there. */
export function placeOfLocation(param: string): string {
  return parseLocation(param)?.place ?? param;
}

/**
 * The visitor's assignment as the `ab_<key>` cookies record it — only the
 * enabled experiments it was actually assigned to, so a request with no
 * cookie (a bot, a crawler, a stale form) is in no experiment at all.
 */
export function assignedBy(cookie: (name: string) => string | undefined): { assigned: Partial<Assignment>; forced: boolean } {
  const assigned: Record<string, string> = {};
  for (const key of KEYS) {
    const raw = cookie(cookieName(key));
    if (enabled(key) && raw !== undefined) assigned[key] = resolveVariant(EXPERIMENTS, key, raw);
  }
  return { assigned: assigned as Partial<Assignment>, forced: cookie(QA_COOKIE) === "1" };
}

/**
 * Crawlers and link previews: always the control, and no cookie, so they are
 * never an exposure. `HeadlessChrome` is not here — it is the e2e browser.
 */
const BOT = /bot\b|bot\/|crawler|spider|slurp|preview|facebookexternalhit|lighthouse|pagespeed/i;

export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT.test(userAgent);
}
