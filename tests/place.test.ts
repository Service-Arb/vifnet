import { describe, expect, it } from "vitest";
import { PLACE } from "@/entities/place";
import type { Locale } from "@/shared/config/i18n";
import type { Place } from "@/shared/landing";

// The guarantees here are compile-time: `tsc` fails if an `@ts-expect-error`
// line stops being an error. The runtime assertions only keep vitest honest.
describe("a Vifnet place", () => {
  it("is a service-area business", () => {
    expect(PLACE.presence).toEqual({ kind: "service-area" });
  });

  it("has no way to carry a storefront, an address or coordinates", () => {
    const storefront: Place<Locale> = {
      ...PLACE,
      // @ts-expect-error — no storefront presence in this repo
      presence: { kind: "storefront" },
    };
    const addressed: Place<Locale> = {
      ...PLACE,
      // @ts-expect-error — a presence has no address
      presence: { kind: "service-area", address: { street: "1 rue de la Paix" } },
    };
    const radius: Place<Locale> = {
      ...PLACE,
      // @ts-expect-error — a service area is named communes, never a centre coordinate
      serviceArea: [{ kind: "radius", center: { lat: 48.85, lng: 2.35 }, km: 10 }],
    };
    expect([storefront, addressed, radius]).toHaveLength(3);
  });
});
