import { createPlaceView, placeGraph } from "@evinvest/kitstart";
import { testLead } from "@evinvest/kitstart/testing";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { copyFor } from "@/entities/content";
import type { Locale } from "@/shared/config/i18n";
import { LEAD, SUBJECTS } from "@/shared/config/lead";
import { PRICES } from "@/shared/config/prices";
import { site } from "@/shared/config/site";
import { PlaceHome, SECTION_IDS } from "@/views/home";

const place = site.places[0];
if (!place) throw new Error("the site has no place");

const home = (locale: Locale) => {
  const view = createPlaceView(site, place, locale, "host");
  const copy = copyFor(locale, { place: place.name[locale], phone: null });
  return renderToStaticMarkup(createElement(PlaceHome, { view, copy, renderedAt: Date.UTC(2026, 8, 24) }));
};

describe("Vifnet before launch", () => {
  it("has no domain, no phone and no mailbox", () => {
    expect(site.brand).toMatchObject({ domain: null, phone: null, email: null });
  });

  it("is one service-area place, with no address, coordinate or map", () => {
    expect(site.topology).toEqual({ kind: "single", place: "vifnet" });
    expect(place.presence).toEqual({ kind: "service-area" });
    const graph = JSON.stringify(placeGraph(site, createPlaceView(site, place, "fr", "host"), "home", { placeName: "Vifnet", title: "t", description: "d" }, new Date()));
    expect(graph).not.toMatch(/PostalAddress|streetAddress|postalCode|GeoCoordinates|hasMap|latitude/);
  });

  it("offers only the confirmed cleaning types", () => {
    expect(SUBJECTS).toEqual(["deep", "upholstery", "exterior", "other"]);
  });
});

describe("the home page", () => {
  it.each(["fr", "en"] as const)("offers the form as the only channel (%s)", locale => {
    const html = home(locale);
    expect(html).not.toMatch(/href="tel:|wa\.me|whatsapp/i);
    expect(html).toMatch(/<form id="quote"[^>]*action="\/quote"[^>]*method="post"/);
    for (const name of [LEAD.wire.subject, LEAD.wire.locality, LEAD.wire.mobile, "surface_m2"]) expect(html).toContain(`name="${name}"`);
    // One form, on the hero's card; every CTA lands on that card.
    expect(html.match(/<form\b/g)).toHaveLength(1);
    expect(html).toMatch(new RegExp(`id="${SECTION_IDS.quote}"[^]*<form id="quote"`));
    expect(html).toContain(`href="/${locale}#${SECTION_IDS.quote}"`);
  });

  it("leaves out the bands the owner has no facts for, and every link to them", () => {
    const html = home("fr");
    expect(PRICES).toBeNull();
    for (const id of [SECTION_IDS.prices, SECTION_IDS.reviews, SECTION_IDS.area]) {
      expect(html).not.toContain(`id="${id}"`);
      expect(html).not.toContain(`#${id}"`);
    }
    for (const id of [SECTION_IDS.work, SECTION_IDS.services, SECTION_IDS.steps, SECTION_IDS.faq, SECTION_IDS.closing]) expect(html).toContain(`id="${id}"`);
    // No rating without a live one: not in the hero either.
    expect(html).not.toContain("Note Google");
  });

  it("serves the photos as AVIF and WebP", () => {
    const html = home("fr");
    expect(html).toContain('type="image/avif"');
    expect(html).toContain('type="image/webp"');
  });
});

describe("the lead", () => {
  const lead = (surface?: string) => ({ ...testLead(), subject: "deep", extras: surface === undefined ? {} : { surface_m2: surface } });

  it("takes an absent or whole-number surface", () => {
    expect(LEAD.validate?.(lead())).toBeNull();
    expect(LEAD.validate?.(lead("85"))).toBeNull();
  });

  it("refuses a surface that is not whole square metres in range, and a short number", () => {
    for (const bad of ["85.5", "0", "1000000", "abc"]) expect(LEAD.validate?.(lead(bad)), bad).not.toBeNull();
    expect(LEAD.validate?.({ ...lead(), mobile: "0612" })).not.toBeNull();
  });
});
