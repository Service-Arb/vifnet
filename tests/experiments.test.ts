import type { AnalyticsSink } from "@evinvest/analytics";
import { describe, expect, it } from "vitest";
import { experimentEvent } from "@/features/experiment/model/events";
import { withExperimentLead, witnessedDefer } from "@/features/experiment/server";
import { EXPERIMENTS } from "@/shared/config/experiments";
import { assignedBy, bucketSuffix, CONTROL, isBot, parseLocation, placeOfLocation } from "@/shared/lib/experiments";

describe("the bucket in the place param", () => {
  it("is no suffix for the control, one `~key.variant` otherwise", () => {
    expect(bucketSuffix(CONTROL)).toBe("");
    expect(bucketSuffix({ ...CONTROL, lead_layout: "b" })).toBe("~lead_layout.b");
  });

  it("round-trips, and the place is what the loader gets", () => {
    expect(parseLocation("_vifnet~lead_layout.b")).toEqual({ place: "_vifnet", assignment: { lead_layout: "b" } });
    expect(parseLocation("_vifnet")).toEqual({ place: "_vifnet", assignment: CONTROL });
    expect(placeOfLocation("_vifnet~lead_layout.b")).toBe("_vifnet");
  });

  it("refuses a suffix the proxy never writes: no second cache entry for the same page", () => {
    for (const bad of ["_vifnet~lead_layout.a", "_vifnet~lead_layout.z", "_vifnet~nope.b", "_vifnet~lead_layout.b~lead_layout.b"]) {
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

describe("who is in the experiment", () => {
  it("is whoever carries an ab_ cookie; the QA cookie marks it forced", () => {
    const jar: Record<string, string> = { ab_lead_layout: "b", ab__qa: "1" };
    expect(assignedBy(n => jar[n])).toEqual({ assigned: { lead_layout: "b" }, forced: true });
    expect(assignedBy(() => undefined)).toEqual({ assigned: {}, forced: false });
    expect(assignedBy(n => (n === "ab_lead_layout" ? "garbage" : undefined)).assigned).toEqual({ lead_layout: "a" });
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
    expect(experimentEvent("lead_layout", "lead_layout_exposed", { variant: "b" }, false)).toEqual([
      "experiment_exposed",
      { experiment: "lead_layout", variant: "b", forced: false },
    ]);
    expect(experimentEvent("lead_layout", "lead_layout_step", { variant: "a", step: 2 }, true)).toEqual([
      "experiment_step",
      { experiment: "lead_layout", variant: "a", step: 2, forced: true },
    ]);
    expect(experimentEvent("lead_layout", "lead_layout_clicked", {}, false)).toBeNull();
    expect(experimentEvent("lead_layout", "other_exposed", {}, false)).toBeNull();
  });
});

describe("experiment_lead on /quote", () => {
  const setup = (accepts: boolean) => {
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
    const post = withExperimentLead(route, { sink: () => sink, defer });
    const run = async (cookie?: string) => {
      await post(new Request("http://x/quote", { method: "POST", headers: cookie ? { cookie } : {} }));
      for (const task of tasks.splice(0)) task();
      return captured;
    };
    return run;
  };

  it("is sent once per experiment for an accepted lead, forced or not", async () => {
    expect(await setup(true)("lang=fr; ab_lead_layout=b")).toEqual([["experiment_lead", { experiment: "lead_layout", variant: "b", forced: false }]]);
    expect(await setup(true)("ab_lead_layout=a; ab__qa=1")).toEqual([["experiment_lead", { experiment: "lead_layout", variant: "a", forced: true }]]);
  });

  it("is not sent for a rejected or suspected submission, nor without a cookie", async () => {
    expect(await setup(false)("ab_lead_layout=b")).toEqual([]);
    expect(await setup(true)()).toEqual([]);
  });
});
