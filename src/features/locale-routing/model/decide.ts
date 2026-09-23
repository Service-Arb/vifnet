import { i18n, isLocale, type Locale } from "@/shared/config/i18n";
import { SITE } from "@/shared/config/site";

/**
 * Which language a request gets, decided before any route renders. Pure, so
 * it is tested without a server. The single-place cut of aquafix's `decide`:
 * no hosts, no slugs, no legacy pages.
 *
 * ```text
 * ?lang=<l> on a page            → cookie for a year, 303 to the clean URL
 * unprefixed page, cookie or not → 302 to /<cookie ?? Accept-Language>/…
 * anything else                  → through
 * ```
 *
 * The negotiation is a 302, never a 301: the choice is per visitor and must
 * not be cached as permanent.
 */
export const LANG_COOKIE = "lang";
export const LANG_COOKIE_MAX_AGE = 31_536_000;

export interface RequestFacts {
  pathname: string;
  query: URLSearchParams;
  acceptLanguage: string | null;
  cookieLang: string | null;
}

/**
 * The language of the path, for the one render that gets no params:
 * `not-found.tsx`. Only the proxy sets it; a client-sent value is dropped.
 */
export const LOCALE_HEADER = "x-vifnet-locale";

export type Decision =
  | { kind: "pass"; locale: Locale | null }
  | { kind: "negotiate"; location: string }
  | { kind: "choose"; location: string; locale: Locale };

const PAGE_SUFFIXES: readonly string[] = Object.values(SITE.pages);

function split(pathname: string): { locale: Locale | null; rest: string } {
  const trimmed = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const [, first = "", ...more] = trimmed.split("/");
  if (isLocale(first)) return { locale: first, rest: more.length ? `/${more.join("/")}` : "" };
  return { locale: null, rest: trimmed === "/" ? "" : trimmed };
}

function withQuery(path: string, query: URLSearchParams): string {
  const rest = new URLSearchParams(query);
  rest.delete("lang");
  const qs = rest.toString();
  return qs ? `${path}?${qs}` : path;
}

export function decide(req: RequestFacts): Decision {
  const { locale, rest } = split(req.pathname);
  if (!PAGE_SUFFIXES.includes(rest)) return { kind: "pass", locale };
  const asked = req.query.get("lang");
  if (isLocale(asked)) {
    return { kind: "choose", locale: asked, location: withQuery(i18n.localePath(asked, rest || "/"), req.query) };
  }
  if (locale !== null) return { kind: "pass", locale };
  const chosen = isLocale(req.cookieLang) ? req.cookieLang : i18n.negotiate(req.acceptLanguage);
  return { kind: "negotiate", location: withQuery(i18n.localePath(chosen, rest || "/"), req.query) };
}
