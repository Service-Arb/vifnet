import { cookieName, forcedVariant } from "@evinvest/experiments";
import { abProxy } from "@evinvest/experiments/next";
import { createRouting, parsePlaceParam } from "@evinvest/kitstart";
import { createProxy, GONE_HEADER, LANG_COOKIE } from "@evinvest/kitstart/proxy";
import { NextResponse, type NextRequest } from "next/server";
import { liveExperiments } from "@/shared/config/env";
import { EXPERIMENTS, type ExperimentKey, FORCE_PARAM, type LiveExperiments, QA_COOKIE, QA_PAUSED_COOKIE } from "@/shared/config/experiments";
import { site } from "@/shared/config/site";
import { assignedBy, type Bucket, bucketSuffix, isBot, isQaMark, parseLocation, parseQaSnapshot, pausedOf, qaSnapshot, runningOf, storedArms } from "@/shared/lib/experiments";

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
 * path — `/fr/_vifnet~lead_form.b~booking_provider.a`, every experiment
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
  const sent = storedArms(name => request.cookies.get(name)?.value);
  // Draws an arm into `request.cookies` for every running test the visitor has
  // none of; no force here — a forced arm is the URL's, laid over these below.
  abProxy(live, request);
  const qa = qaState(live, request);
  const { assigned: bucket } = assignedBy(live, name => request.cookies.get(name)?.value);
  const suffix = bucketSuffix(bucket);
  const response = suffix ? NextResponse.rewrite(new URL(`${decision.pathname}${suffix}${url.search}`, url), { request: { headers: withoutGoneHeader(request) } }) : routed;

  // Only what changed against what the browser sent: a visitor who is not QA
  // and has every arm gets no cookie at all.
  const stored = storedArms(name => request.cookies.get(name)?.value);
  for (const key of KEYS) {
    const value = stored[key];
    if (value !== undefined && value !== sent[key]) response.cookies.set(cookieName(key), value, { path: "/", maxAge: ASSIGNMENT_MAX_AGE, sameSite: "lax" });
  }
  if (qa.kind === "forced") {
    // Sent on every forced visit, unchanged or not: QA lasts 30 days from the last force.
    response.cookies.set(QA_COOKIE, qa.snapshot, { path: "/", maxAge: ASSIGNMENT_MAX_AGE, sameSite: "lax" });
    // The visit this response marks is QA already: its menu mounts on this very page.
    pausedForQa(request, response, live);
  } else if (qa.kind === "left") {
    response.cookies.set(QA_COOKIE, "", { path: "/", maxAge: 0, sameSite: "lax" });
    if (request.cookies.has(QA_PAUSED_COOKIE)) response.cookies.set(QA_PAUSED_COOKIE, "", { path: "/", maxAge: 0, sameSite: "lax" });
  }
  return response;
}

type QaState = { kind: "none" } | { kind: "forced"; snapshot: string } | { kind: "left" };

/**
 * The QA side of a home page request, applied to `request.cookies` (the
 * bucket of this render, and what events and the lead's post read off
 * `ab_<key>` after it). A URL with a force is the whole QA state: each test
 * takes the URL's arm, else the visitor's own — so `?ab_lead_channel=a` after
 * `?ab_lead_form=b` puts lead_form back, not on b. The visitor's own arms are
 * the snapshot in `QA_COOKIE`, taken on the first forced visit (after
 * `abProxy` drew a newcomer's) and never retaken while it lasts, since by then
 * `ab_<key>` holds forced arms. The home page with no force ends QA: the own
 * arms come back and the mark goes, the menu with it. A paused test's arm is
 * restored too: a pause keeps every visitor's `ab_<key>`.
 */
function qaState(live: LiveExperiments, request: NextRequest): QaState {
  const params = request.nextUrl.searchParams;
  const forcedArms: Record<string, string> = {};
  for (const key of KEYS) {
    const variant = forcedVariant(live, key, params.get(`${FORCE_PARAM}${key}`));
    if (variant !== undefined) forcedArms[key] = variant;
  }
  // Each value is `forcedVariant`'s, one of its key's variants.
  const forced = forcedArms as Bucket;
  const mark = request.cookies.get(QA_COOKIE)?.value;
  const qa = isQaMark(mark) ? mark : undefined;
  if (!Object.keys(forced).length) {
    if (qa === undefined) return { kind: "none" };
    setArms(request, parseQaSnapshot(qa));
    return { kind: "left" };
  }
  // A key the snapshot lacks (a test switched on mid-QA) is taken from the
  // cookie as it stands: no force has touched it yet. The legacy `1` holds no
  // arm, so such a browser's cookies, forced ones too, become its own.
  const own: Bucket = { ...storedArms(name => request.cookies.get(name)?.value), ...(qa === undefined ? {} : parseQaSnapshot(qa)) };
  setArms(request, { ...own, ...forced });
  return { kind: "forced", snapshot: qaSnapshot(own) };
}

function setArms(request: NextRequest, bucket: Bucket): void {
  for (const key of KEYS) {
    const value = bucket[key];
    if (value !== undefined) request.cookies.set(cookieName(key), value);
  }
}

/**
 * A forced visit's browser (the caller checks) learns which tests the panel has paused (`QA_PAUSED_COOKIE`),
 * for its menu. Only the paused list: a pause keeps every visitor's
 * `ab_<key>`, so a test switched back on carries on with the same arms.
 * Nobody else gets a cookie from this.
 */
function pausedForQa(request: NextRequest, response: NextResponse, live: LiveExperiments): void {
  const paused = pausedOf(live).join(",");
  if (paused) response.cookies.set(QA_PAUSED_COOKIE, paused, { path: "/", sameSite: "lax" });
  else if (request.cookies.has(QA_PAUSED_COOKIE)) response.cookies.set(QA_PAUSED_COOKIE, "", { path: "/", maxAge: 0, sameSite: "lax" });
}

export const config = {
  // A literal: Next reads it statically. Everything but the build output,
  // files included: `decide` passes the routes outside `[locale]` and
  // `site.publicFiles`, and sends any other path to the 404.
  matcher: ["/((?!_next/).*)"],
};
