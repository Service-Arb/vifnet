import { forcedVariant } from "@evinvest/experiments";
import { abProxy } from "@evinvest/experiments/next";
import { createRouting, parsePlaceParam } from "@evinvest/kitstart";
import { createProxy, GONE_HEADER, LANG_COOKIE } from "@evinvest/kitstart/proxy";
import { NextResponse, type NextRequest } from "next/server";
import { liveExperiments } from "@/shared/config/env";
import { EXPERIMENTS, type ExperimentKey, FORCE_PARAM, QA_COOKIE } from "@/shared/config/experiments";
import { site } from "@/shared/config/site";
import { assignedBy, bucketSuffix, isBot, parseLocation, runningOf } from "@/shared/lib/experiments";

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
 * kitstart's routing, then the home page's experiments under the panel's
 * overrides (`liveExperiments`): `abProxy` assigns the sticky `ab_<key>`
 * cookies (bots skipped), and the visitor is rewritten to the bucket's own
 * path — `/fr/_vifnet~lead_layout.b~booking_provider.a`, every experiment
 * that runs spelt out — so every bucket is an ISR entry and no page reads the
 * request or the panel.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl;
  const home = homeOf(url.pathname);

  // A bucket's path, as this proxy wrote it (Next may run the proxy again on
  // a rewrite target): served as it is, unless it names an experiment the
  // panel has since switched off — that one is dropped, so a cached page of
  // a stopped test is never served again. kitstart would call it a dead path.
  const internal = home?.param.includes("~") ? parseLocation(home.param) : null;
  if (home && internal && site.placeSlugs.includes(parsePlaceParam(internal.place).slug)) {
    const headers = withoutGoneHeader(request);
    const suffix = bucketSuffix(runningOf(await liveExperiments(), internal.bucket));
    if (`${internal.place}${suffix}` === home.param) return NextResponse.next({ request: { headers } });
    return NextResponse.rewrite(new URL(`/${home.locale}/${internal.place}${suffix}${url.search}`, url), { request: { headers } });
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

  const live = await liveExperiments();
  // Writes new assignments into `request.cookies` and its response's Set-Cookie.
  const assigned = abProxy(live, request, { forceParam: FORCE_PARAM });
  const { assigned: bucket } = assignedBy(live, name => request.cookies.get(name)?.value);
  const suffix = bucketSuffix(bucket);
  const response = suffix ? NextResponse.rewrite(new URL(`${decision.pathname}${suffix}${url.search}`, url), { request: { headers: withoutGoneHeader(request) } }) : routed;

  for (const cookie of assigned.cookies.getAll()) response.cookies.set(cookie);
  if (KEYS.some(k => forcedVariant(live, k, url.searchParams.get(`${FORCE_PARAM}${k}`)) !== undefined)) {
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
