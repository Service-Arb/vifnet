import { describe, expect, it } from "vitest";
import { LEAD, OWNER_TODO, SITE } from "@/shared/config/site";
import { assertLaunchable, defineSite } from "@/shared/landing";

describe("the site config", () => {
  it("cannot be given a domain while a launch-blocking fact is missing", () => {
    expect(() => assertLaunchable({ brand: { domain: "vifnet.example" } }, OWNER_TODO)).toThrow(/brand\.domain/);
    expect(() => assertLaunchable(SITE, OWNER_TODO)).not.toThrow();
  });

  it("rejects a single-place topology that names another place", () => {
    expect(() => defineSite({ ...SITE, topology: { kind: "single", place: "elsewhere" } })).toThrow(/topology/);
  });

  it("rejects a domain written as a URL", () => {
    expect(() => defineSite({ ...SITE, brand: { ...SITE.brand, domain: "https://vifnet.example" } })).toThrow(/bare/);
  });
});

describe("the lead schema", () => {
  const lead = (surface: string | undefined) => ({
    subject: "deep" as const,
    locality: "Paris",
    mobile: "0612345678",
    extras: surface === undefined ? {} : { surface_m2: surface },
  });

  it("takes an absent or whole-number surface", () => {
    expect(LEAD.validate(lead(undefined))).toBeNull();
    expect(LEAD.validate(lead("85"))).toBeNull();
  });

  it("refuses a surface that is not a whole number of square metres in range", () => {
    expect(LEAD.validate(lead("85.5"))).not.toBeNull();
    expect(LEAD.validate(lead("0"))).not.toBeNull();
    expect(LEAD.validate(lead("1000000"))).not.toBeNull();
  });
});
