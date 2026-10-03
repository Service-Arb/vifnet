import { forcedVariant } from "@evinvest/experiments";
import { abProxy } from "@evinvest/experiments/next";
import { createRouting, parsePlaceParam } from "@evinvest/kitstart";
import { createProxy, GONE_HEADER, LANG_COOKIE } from "@evinvest/kitstart/proxy";
import { NextResponse, type NextRequest } from "next/server";
import { EXPERIMENTS, type ExperimentKey, FORCE_PARAM, QA_COOKIE } from "@/shared/config/experiments";
import { site } from "@/shared/config/site";
import { assignedBy, bucketSuffix, CONTROL, isBot, parseLocation } from "@/shared/lib/experiments";

const kitstart = createProxy(site);
const routing = createRouting(site);
const KEYS = Object.keys(EXPERIMENTS) as ExperimentKey[];
const ASSIGNMENT_MAX_AGE = 60 * 60 * 24 * 30;

/** `/<locale>/<place param>`: a place's home page, the one page with experiments. */
function homeOf(pathname: string): { locale: string; param: string } | null {
  const [, locale = "", param = "", ...rest] = pathname.split("/");
  if (rest.length || !site.i18n.isLocale(locale) || !param) return null;
  return { locale, param };
}

function withoutGoneHeader(request: NextRequest): Headers {
  const headers = new Headers(request.headers);
  headers.delete(GONE_HEADER);
  return headers;
}

/**
 * kitstart's routing, then the home page's experiments: `abProxy` assigns the
 * sticky `ab_<key>` cookies (bots skipped), and a visitor off the control is
 * rewritten to the bucket's own path — `/fr/_vifnet~lead_layout.b` —
 * so every bucket is an ISR entry and no page reads the request.
 */
export function proxy(request: NextRequest): NextResponse {
  const url = request.nextUrl;
  const home = homeOf(url.pathname);

  // A bucket's path, as this proxy wrote it (Next may run the proxy again on
  // a rewrite target): served as it is. kitstart would call it a dead path.
  const internal = home?.param.includes("~") ? parseLocation(home.param) : null;
  if (internal && site.placeSlugs.includes(parsePlaceParam(internal.place).slug)) {
    return NextResponse.next({ request: { headers: withoutGoneHeader(request) } });
  }

  const routed = kitstart(request);
  const decision = routing.decide({
    host: request.headers.get("host") ?? url.host,
    pathname: url.pathname,
    query: url.searchParams,
    acceptLanguage: request.headers.get("accept-language"),
    cookieLang: request.cookies.get(LANG_COOKIE)?.value ?? null,
  });
  if (decision.kind !== "serve" || !homeOf(decision.pathname) || isBot(request.headers.get("user-agent"))) return routed;

  // Writes new assignments into `request.cookies` and its response's Set-Cookie.
  const assigned = abProxy(EXPERIMENTS, request, { forceParam: FORCE_PARAM });
  const { assigned: variants } = assignedBy(name => request.cookies.get(name)?.value);
  const suffix = bucketSuffix({ ...CONTROL, ...variants });
  const response = suffix ? NextResponse.rewrite(new URL(`${decision.pathname}${suffix}${url.search}`, url), { request: { headers: withoutGoneHeader(request) } }) : routed;

  for (const cookie of assigned.cookies.getAll()) response.cookies.set(cookie);
  if (KEYS.some(k => forcedVariant(EXPERIMENTS, k, url.searchParams.get(`${FORCE_PARAM}${k}`)) !== undefined)) {
    response.cookies.set(QA_COOKIE, "1", { path: "/", maxAge: ASSIGNMENT_MAX_AGE, sameSite: "lax" });
  }
  return response;
}

export const config = {
  // A literal: Next reads it statically. Everything but the build output,
  // files included: `decide` passes the routes outside `[locale]` and
  // `site.publicFiles`, and sends any other path to the 404.
  matcher: ["/((?!_next/).*)"],
};
