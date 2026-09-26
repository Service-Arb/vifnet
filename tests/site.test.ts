import { createPlaceView, placeGraph } from "@evinvest/kitstart";
import { testLead } from "@evinvest/kitstart/testing";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { copyFor } from "@/entities/content";
import type { Locale } from "@/shared/config/i18n";
import { LEAD, SUBJECTS } from "@/shared/config/lead";
import { SAMPLE_PHONE } from "@/shared/config/sample";
import { site } from "@/shared/config/site";
import { PlaceHome, SECTION_IDS } from "@/views/home";

const place = site.places[0];
if (!place) throw new Error("the site has no place");

const home = (locale: Locale) => {
  const view = createPlaceView(site, place, locale, "host");
  const copy = copyFor(locale, { place: place.name[locale], phone: null });
  return renderToStaticMarkup(createElement(PlaceHome, { view, copy, renderedAt: Date.UTC(2026, 8, 24) }));
};

/** Every JSON-LD block of the page, parsed. */
const jsonLd = (html: string): unknown[] =>
  [...html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].map(m => JSON.parse(m[1] ?? "null") as unknown);

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

  it("offers the frame's four services", () => {
    expect(SUBJECTS).toEqual(["standard", "deep", "move", "post-construction"]);
  });
});

describe("the home page", () => {
  it.each(["fr", "en"] as const)("posts one form, on the hero's card, with every field (%s)", locale => {
    const html = home(locale);
    expect(html).toMatch(/<form id="quote"[^>]*action="\/quote"[^>]*method="post"/);
    for (const name of [LEAD.wire.subject, LEAD.wire.locality, LEAD.wire.mobile, "name", "bedrooms"]) expect(html).toContain(`name="${name}"`);
    expect(html.match(/<form\b/g)).toHaveLength(1);
    expect(html).toMatch(new RegExp(`id="${SECTION_IDS.quote}"[^]*<form id="quote"`));
    expect(html).toContain(`href="/${locale}#${SECTION_IDS.quote}"`);
  });

  it.each(["fr", "en"] as const)("renders the frame's bands, in its order, and no other (%s)", locale => {
    const html = home(locale);
    const bands = ["quote-card", "stats", "services", "reviews", "guarantee", "faq", "cta", "sticky"];
    const at = bands.map(b => html.indexOf(`data-band="${b}"`));
    expect(at.every(i => i >= 0)).toBe(true);
    expect(at).toEqual([...at].sort((a, b) => a - b));
    for (const gone of ["avant-apres", "etapes", "zone", "tarifs"]) expect(html).not.toContain(`id="${gone}"`);
  });

  it("calls the frame's sample number, and offers no WhatsApp", () => {
    const html = home("fr");
    expect(html).toContain(`href="${SAMPLE_PHONE.href}"`);
    expect(html).not.toMatch(/wa\.me|whatsapp/i);
  });

  it.each(["fr", "en"] as const)("keeps the frame's sample facts out of the structured data (%s)", locale => {
    const ld = JSON.stringify(jsonLd(home(locale)));
    expect(ld).not.toBe("[]");
    expect(ld).not.toMatch(/aggregateRating|"review"|telephone|555-0192|Boise/);
  });

  it("links to the other language from the footer", () => {
    expect(home("fr")).toMatch(/<a href="\/en\?lang=en"[^>]*>English<\/a>/);
    expect(home("en")).toMatch(/<a href="\/fr\?lang=fr"[^>]*>Français<\/a>/);
  });

  it("serves the photos as AVIF and WebP", () => {
    const html = home("fr");
    expect(html).toContain('type="image/avif"');
    expect(html).toContain('type="image/webp"');
  });
});

describe("the lead", () => {
  const lead = (extras: Record<string, string>) => ({ ...testLead(), subject: "standard", extras });

  it("takes a name, and bedrooms from the list or none", () => {
    expect(LEAD.validate?.(lead({ name: "Amanda Reyes", bedrooms: "3" }))).toBeNull();
    expect(LEAD.validate?.(lead({ name: "Amanda Reyes" }))).toBeNull();
  });

  it("refuses no name, bedrooms off the list, and a short number", () => {
    expect(LEAD.validate?.(lead({ name: " " }))).not.toBeNull();
    expect(LEAD.validate?.(lead({ name: "Amanda", bedrooms: "12" }))).not.toBeNull();
    expect(LEAD.validate?.({ ...lead({ name: "Amanda" }), mobile: "0612" })).not.toBeNull();
  });
});
