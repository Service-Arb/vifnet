import { describe, expect, it } from "vitest";
import { type Arm, beta, compare, gamma, hogql, report, type Row, seeded, STOP, tally, verdict } from "../scripts/ab-report";

const arm = (variant: string, exposures: number, leads = 0): Arm => ({ variant, exposures, leads, calls: 0, formOpens: 0, steps: 0, first: 0, last: 0 });

describe("the sampler", () => {
  it("draws Gamma and Beta with the right means", () => {
    const rng = seeded(1);
    const n = 20_000;
    let g = 0;
    let small = 0;
    let b = 0;
    for (let i = 0; i < n; i++) {
      g += gamma(3, rng);
      small += gamma(0.5, rng);
      b += beta(2, 8, rng);
    }
    expect(g / n).toBeCloseTo(3, 1);
    expect(small / n).toBeCloseTo(0.5, 1);
    expect(b / n).toBeCloseTo(0.2, 2);
  });
});

describe("compare", () => {
  it("is a coin toss between equal arms, with equal losses", () => {
    const c = compare({ successes: 10, trials: 200 }, { successes: 10, trials: 200 }, 50_000, seeded(2));
    expect(c.pBBeatsA).toBeGreaterThan(0.45);
    expect(c.pBBeatsA).toBeLessThan(0.55);
    expect(c.lossA).toBeCloseTo(c.lossB, 3);
  });

  it("is sure of a large difference, and shipping the loser costs about the gap", () => {
    const c = compare({ successes: 20, trials: 1000 }, { successes: 60, trials: 1000 }, 50_000, seeded(3));
    expect(c.pBBeatsA).toBeGreaterThan(0.999);
    expect(c.lossB).toBeLessThan(0.0005);
    expect(c.lossA).toBeCloseTo(0.04, 2);
  });

  it("caps more successes than trials instead of failing", () => {
    const c = compare({ successes: 5, trials: 3 }, { successes: 0, trials: 3 }, 1000, seeded(4));
    expect(c.pBBeatsA).toBeLessThan(0.2);
  });
});

describe("the stop rule", () => {
  const a = arm("a", STOP.minExposures);
  const b = arm("b", STOP.minExposures);

  it("keeps running before 14 days or 100 exposures an arm, however sure", () => {
    expect(verdict(STOP.minDays - 1, a, b, 0.999, 1)).toBe("keep running");
    expect(verdict(30, a, arm("b", STOP.minExposures - 1), 0.999, 1)).toBe("keep running");
  });

  it("ships b past 0.95, keeps a under 0.05, runs on between", () => {
    expect(verdict(STOP.minDays, a, b, 0.96, 0.9)).toBe("ship b");
    expect(verdict(STOP.minDays, a, b, 0.04, 0.1)).toBe("keep a");
    expect(verdict(STOP.minDays, a, b, 0.5, 0.5)).toBe("keep running");
  });

  it("does not ship b when the guardrail says contacts fell", () => {
    expect(verdict(STOP.minDays, a, b, 0.97, 0.05)).toBe("keep running");
  });
});

describe("the tally and the report", () => {
  const at = "2026-09-01T00:00:00Z";
  const row = (variant: string, event: string, n: number, channel = ""): Row => ({ experiment: "quote_single_step", variant, event, channel, n, first: at, last: at });
  const rows = [
    row("a", "experiment_exposed", 500),
    row("a", "experiment_lead", 10),
    row("a", "experiment_contact", 7, "phone"),
    row("a", "experiment_contact", 30, "form_open"),
    row("a", "experiment_step", 40),
    row("b", "experiment_exposed", 480),
    row("b", "experiment_lead", 25),
    row("b", "experiment_contact", 2, "whatsapp"),
    row("b", "experiment_contact", 1, "booking"),
  ];

  it("splits contacts into calls and form opens", () => {
    const arms = tally(rows).get("quote_single_step");
    expect(arms?.get("a")).toMatchObject({ exposures: 500, leads: 10, calls: 7, formOpens: 30, steps: 40 });
    expect(arms?.get("b")).toMatchObject({ exposures: 480, leads: 25, calls: 2, formOpens: 1, steps: 0 });
  });

  it("prints the rates and a verdict", () => {
    const text = report(rows, Date.parse(at) + 20 * 86_400_000, seeded(5));
    expect(text).toContain("20.0 days running");
    expect(text).toMatch(/a\s+500\s+10\s+7\s+30\s+40\s+2\.00 %\s+3\.40 %/);
    expect(text).toContain("verdict: ship b");
  });

  it("filters the brand and forced traffic in the query", () => {
    const q = hogql(90);
    expect(q).toContain("properties.brand_id = {brand}");
    expect(q).toContain("!= 'true'");
    expect(q).toContain("INTERVAL 90 DAY");
  });
});
