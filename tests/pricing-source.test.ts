import type { PricingModel } from "@evinvest/kitstart";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { pricing } from "@/shared/config/env";
import { PRICING } from "@/shared/config/pricing";

// The panel's internal base for vifnet, as LOCATIONS_API_URL is set in a
// deploy: the place is `<base>/locations/vifnet`, the price list `<base>/pricing`.
const SOURCE = "http://panel.test/api/internal/brands/vifnet";

beforeAll(() => {
  // Read once, lazily, by the first `serverEnv()`.
  process.env["LOCATIONS_API_URL"] = SOURCE;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const silent = () => vi.spyOn(console, "error").mockImplementation(() => {});

function answer(status: number, body: unknown) {
  const fetch = vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }));
  vi.stubGlobal("fetch", fetch);
  return fetch;
}

/** The owner's prices from the panel: the baked shape, other numbers. */
const LIVE: PricingModel = { ...PRICING, validFrom: "2026-11-01", needs: { standard: { kind: "estimate", baseCents: 6000, inputs: ["bedrooms", "surface", "frequency"] } } };

describe("the price list from the panel", () => {
  it("is asked of the place source's base, and overrides the baked model", async () => {
    const fetch = answer(200, LIVE);
    expect(await pricing.model()).toEqual(LIVE);
    expect(fetch).toHaveBeenCalledWith(`${SOURCE}/pricing`, expect.anything());
  });

  it("is the baked model when the panel sets none", async () => {
    answer(200, {});
    expect(await pricing.model()).toBe(PRICING);
  });

  it("is the baked model when the panel is down or answers a broken model", async () => {
    const log = silent();
    answer(503, { error: "down" });
    expect(await pricing.model()).toBe(PRICING);
    answer(200, { ...LIVE, currency: "USD" });
    expect(await pricing.model()).toBe(PRICING);
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("fetch failed"))));
    expect(await pricing.model()).toBe(PRICING);
    expect(log).toHaveBeenCalledTimes(3);
    log.mockRestore();
  });
});
