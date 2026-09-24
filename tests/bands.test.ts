import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { copyFor } from "@/entities/content";
import { site } from "@/shared/config/site";
import { PriceTable } from "@/widgets/price-table";
import { Reviews } from "@/widgets/reviews";
import { ServiceArea } from "@/widgets/service-area";

// The bands that wait for the owner's facts render nothing today, so the home
// page never shows them; this is where they are held to what they will show.
const copy = copyFor("fr", { place: "Vifnet", phone: null });
const place = site.places[0];
if (!place) throw new Error("the site has no place");
const html = (el: ReturnType<typeof createElement>) => renderToStaticMarkup(el);

describe("the price table", () => {
  it("is absent without a price list", () => {
    expect(html(createElement(PriceTable, { copy, id: "tarifs", prices: null }))).toBe("");
  });

  it("prints each job with its price TTC in euros", () => {
    const out = html(createElement(PriceTable, { copy, id: "tarifs", prices: [{ subject: "deep", eur: 1234 }] }));
    expect(out).toContain("Grand ménage");
    expect(out).toMatch(/1\s?234\s€/u);
    expect(out).toContain("tabular-nums");
  });
});

describe("the reviews band", () => {
  it("is absent without a rating", () => {
    expect(html(createElement(Reviews, { copy, id: "avis", rating: null }))).toBe("");
  });

  it("states the Google rating it was given", () => {
    const out = html(createElement(Reviews, { copy, id: "avis", rating: { value: 4.8, count: 37, fetchedAt: "2026-09-24T00:00:00Z" } }));
    expect(out).toContain("Note Google 4,8 / 5 — 37 avis");
  });
});

describe("the service area band", () => {
  it("is absent until the communes are named", () => {
    expect(html(createElement(ServiceArea, { copy, id: "zone", place }))).toBe("");
  });

  it("lists the communes as chips, with no address or map", () => {
    const named = { ...place, serviceArea: [{ kind: "localities" as const, names: ["Paris 15e", "Issy-les-Moulineaux"] }] };
    const out = html(createElement(ServiceArea, { copy, id: "zone", place: named }));
    expect(out).toContain("Paris 15e");
    expect(out).toContain("Issy-les-Moulineaux");
    expect(out).not.toMatch(/maps\.google|iframe|<address/);
  });
});
