import type { AnalyticsSink } from "@evinvest/analytics";
import { applyOverrides } from "@evinvest/experiments";
import { declarationProblem } from "@evinvest/kitstart/server";
import { describe, expect, it } from "vitest";
import { experimentEvent } from "@/features/experiment/model/events";
import { withExperimentLead, witnessedDefer } from "@/features/experiment/server";
import { BOOKING_EXPERIMENT, bookingOf } from "@evinvest/kitstart";
import { BOOKING_ARMS, EXPERIMENT_SUMMARIES, EXPERIMENTS } from "@/shared/config/experiments";
import { site } from "@/shared/config/site";
import { assignedBy, bucketSuffix, CONTROL, isBot, parseLocation, placeOfLocation, runningOf, variantsOf } from "@/shared/lib/experiments";

/** The config as the panel serves it: none of its overrides, or lead_form switched off. */
const AS_CODED = applyOverrides(EXPERIMENTS, {});
const LAYOUT_OFF = applyOverrides(EXPERIMENTS, { lead_form: { enabled: false } });

describe("the bucket in the place param", () => {
  it("spells out every running test, the control too; no test running is no suffix", () => {
    expect(bucketSuffix({})).toBe("");
    expect(bucketSuffix(CONTROL)).toBe("~lead_form.a~booking_provider.a");
    expect(bucketSuffix({ ...CONTROL, lead_form: "b" })).toBe("~lead_form.b~booking_provider.a");
    expect(bucketSuffix({ booking_provider: "b" })).toBe("~booking_provider.b");
  });

  it("round-trips, and the place is what the loader gets", () => {
    expect(parseLocation("_vifnet~lead_form.b~booking_provider.a")).toEqual({ place: "_vifnet", bucket: { lead_form: "b", booking_provider: "a" } });
    expect(parseLocation("_vifnet~lead_form.a")).toEqual({ place: "_vifnet", bucket: { lead_form: "a" } });
    expect(parseLocation("_vifnet")).toEqual({ place: "_vifnet", bucket: {} });
    expect(placeOfLocation("_vifnet~lead_form.b~booking_provider.b")).toBe("_vifnet");
  });

  it("renders a test that is not in the path as its control, and counts it as not running", () => {
    expect(variantsOf({ booking_provider: "b" })).toEqual({ lead_form: "a", booking_provider: "b" });
    expect(variantsOf({})).toEqual(CONTROL);
  });

  it("refuses a suffix the proxy never writes: no second cache entry for the same page", () => {
    for (const bad of ["_vifnet~lead_form", "_vifnet~lead_form.z", "_vifnet~nope.b", "_vifnet~lead_form.b~lead_form.b", "_vifnet~booking_provider.b~lead_form.b"]) {
      expect(parseLocation(bad)).toBeNull();
      expect(placeOfLocation(bad)).toBe(bad);
    }
  });

  it("keeps variants to what a path segment can carry", () => {
    for (const [key, spec] of Object.entries(EXPERIMENTS)) {
      expect(key).toMatch(/^[a-z0-9_]+$/);
      for (const v of spec.variants) expect(v).toMatch(/^[a-z0-9_]+$/);
    }
  });
});

describe("booking_provider", () => {
  const first = site.places[0];
  if (!first) throw new Error("the site has no place");

  it("is kitstart's key, so the arms pool across brands, and names kitstart's providers", () => {
    expect(BOOKING_EXPERIMENT).toBe("booking_provider");
    expect(EXPERIMENTS[BOOKING_EXPERIMENT]).toMatchObject({ variants: ["a", "b"], weights: [0.5, 0.5] });
    expect(BOOKING_ARMS).toEqual({ a: "manual", b: "google_calendar" });
  });

  // docs/EXPERIMENTS.md: inert until the panel sets a Google schedule for the place.
  it("offers both arms the call while the place has no Google schedule", () => {
    expect(first.booking).toBeUndefined();
    expect(bookingOf(first, BOOKING_ARMS.a)).toEqual({ provider: "manual" });
    expect(bookingOf(first, BOOKING_ARMS.b)).toEqual({ provider: "manual" });
  });

  it("splits once the panel gives the place a schedule", () => {
    const url = "https://calendar.app.google/AbCdEf123";
    const live = { ...first, booking: { default: "manual" as const, providers: { google_calendar: { url } } } };
    expect(bookingOf(live, BOOKING_ARMS.a)).toEqual({ provider: "manual" });
    expect(bookingOf(live, BOOKING_ARMS.b)).toEqual({ provider: "google_calendar", url });
  });
});

describe("who is in the experiment", () => {
  it("is whoever carries an ab_ cookie; the QA cookie marks it forced", () => {
    const jar: Record<string, string> = { ab_lead_form: "b", ab__qa: "1" };
    expect(assignedBy(AS_CODED, n => jar[n])).toEqual({ assigned: { lead_form: "b" }, forced: true });
    expect(assignedBy(AS_CODED, () => undefined)).toEqual({ assigned: {}, forced: false });
    expect(assignedBy(AS_CODED, n => (n === "ab_lead_form" ? "garbage" : undefined)).assigned).toEqual({ lead_form: "a" });
  });

  it("is nobody for a test the panel switched off, whatever the cookie says", () => {
    const jar: Record<string, string> = { ab_lead_form: "b", ab_booking_provider: "b" };
    expect(assignedBy(LAYOUT_OFF, n => jar[n]).assigned).toEqual({ booking_provider: "b" });
    expect(runningOf(LAYOUT_OFF, { lead_form: "b", booking_provider: "a" })).toEqual({ booking_provider: "a" });
    expect(runningOf(AS_CODED, { lead_form: "b" })).toEqual({ lead_form: "b" });
  });

  it("never counts crawlers and previews", () => {
    for (const ua of [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 (compatible; bingbot/2.0)",
      "AdsBot-Google (+http://www.google.com/adsbot.html)",
      "facebookexternalhit/1.1",
      "Mozilla/5.0 (compatible; SemrushBot/7; crawler)",
      "Slackbot-LinkExpanding 1.0",
      null,
    ]) {
      expect(isBot(ua)).toBe(true);
    }
    expect(isBot("Mozilla/5.0 (Linux; Android 14; CUBOT_X30) AppleWebKit/537.36 Chrome/128 Mobile Safari/537.36")).toBe(false);
    expect(isBot("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 HeadlessChrome/131 Safari/537.36")).toBe(false);
  });
});

describe("event names", () => {
  it("map the library's `<key>_<action>` to one name per action", () => {
    expect(experimentEvent("lead_form", "lead_form_exposed", { variant: "b" }, false)).toEqual([
      "experiment_exposed",
      { experiment: "lead_form", variant: "b", forced: false },
    ]);
    expect(experimentEvent("lead_form", "lead_form_step", { variant: "a", step: 2 }, true)).toEqual([
      "experiment_step",
      { experiment: "lead_form", variant: "a", step: 2, forced: true },
    ]);
    expect(experimentEvent("lead_form", "lead_form_clicked", {}, false)).toBeNull();
    expect(experimentEvent("lead_form", "other_exposed", {}, false)).toBeNull();
  });
});

describe("experiment_lead on /quote", () => {
  const setup = (accepts: boolean, live = AS_CODED) => {
    const captured: [string, Record<string, unknown> | undefined][] = [];
    const tasks: (() => unknown)[] = [];
    const defer = (task: () => unknown) => void tasks.push(task);
    const sink: AnalyticsSink = { capture: (e, p) => void captured.push([e, p]) };
    const deferInRoute = witnessedDefer(defer);
    // kitstart's route defers work only for a lead it accepted.
    const route = async () => {
      if (accepts) deferInRoute(() => undefined);
      return new Response(null, { status: 303 });
    };
    const post = withExperimentLead(route, { sink: () => sink, defer, experiments: async () => live });
    const run = async (cookie?: string) => {
      await post(new Request("http://x/quote", { method: "POST", headers: cookie ? { cookie } : {} }));
      for (const task of tasks.splice(0)) task();
      return captured;
    };
    return run;
  };

  it("is sent once per experiment for an accepted lead, forced or not", async () => {
    expect(await setup(true)("lang=fr; ab_lead_form=b")).toEqual([["experiment_lead", { experiment: "lead_form", variant: "b", forced: false }]]);
    expect(await setup(true)("ab_lead_form=a; ab__qa=1")).toEqual([["experiment_lead", { experiment: "lead_form", variant: "a", forced: true }]]);
  });

  it("is not sent for a rejected or suspected submission, nor without a cookie", async () => {
    expect(await setup(false)("ab_lead_form=b")).toEqual([]);
    expect(await setup(true)()).toEqual([]);
  });

  it("is not sent for a test the panel switched off, even with its cookie", async () => {
    expect(await setup(true, LAYOUT_OFF)("ab_lead_form=b; ab_booking_provider=a")).toEqual([
      ["experiment_lead", { experiment: "booking_provider", variant: "a", forced: false }],
    ]);
  });
});

describe("the declaration to the panel", () => {
  it("has a one-line hypothesis for every test, and the panel would take each", () => {
    for (const [key, spec] of Object.entries(EXPERIMENTS)) {
      const summary = EXPERIMENT_SUMMARIES[key as keyof typeof EXPERIMENTS];
      expect(summary.length, key).toBeLessThanOrEqual(200);
      expect(summary, key).not.toContain("\n");
      expect(declarationProblem(key, spec, summary), key).toBeNull();
    }
  });
});
