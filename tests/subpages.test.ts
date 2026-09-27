import { createPlaceView, pointSuffixes, sitemapFor, type Place } from "@evinvest/kitstart";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { copyFor } from "@/entities/content";
import type { Locale } from "@/shared/config/i18n";
import { SAMPLE_PHONE } from "@/shared/config/sample";
import { site, type Subpage } from "@/shared/config/site";
import { PlaceSubpage } from "@/views/subpage";

const place = site.places[0];
if (!place) throw new Error("the site has no place");

const SUBPAGES = ["prices", "guarantee", "about"] as const satisfies readonly Subpage[];
const LOCALES = ["fr", "en"] as const satisfies readonly Locale[];

const render = (locale: Locale, page: Subpage) => {
  const view = createPlaceView(site, place, locale, "host");
  const copy = copyFor(locale, { place: place.name[locale], phone: null });
  return renderToStaticMarkup(createElement(PlaceSubpage, { view, copy, page, renderedAt: Date.UTC(2026, 8, 27) }));
};

const jsonLd = (html: string): string =>
  JSON.stringify([...html.matchAll(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)].map(m => JSON.parse(m[1] ?? "null") as unknown));

/** The order of the `data-band`s a page renders. */
const bandsOf = (html: string) => [...html.matchAll(/data-band="([^"]+)"/g)].map(m => m[1]);

describe("the sub-pages", () => {
  it("are pages of the site: the proxy, the route tree and the sitemap read them", () => {
    expect(site.pages).toMatchObject({ prices: "/prices", guarantee: "/guarantee", about: "/about" });
    expect(pointSuffixes(site)).toEqual(expect.arrayContaining(["/prices", "/guarantee", "/about"]));
  });

  it("are listed in the sitemap in both languages once the site has a domain and the place is published", () => {
    const launched = { ...site, brand: { ...site.brand, domain: "vifnet.example" } };
    const published: Place<Locale> = {
      ...place,
      serviceArea: [{ kind: "localities", names: ["Toulon"] }],
      hours: [{ days: ["Monday"], opens: "08:00", closes: "18:00" }],
    };
    const urls = sitemapFor(launched, "vifnet.example", [published]).map(e => new URL(e.url).pathname);
    for (const locale of LOCALES) for (const suffix of ["", "/prices", "/guarantee", "/about"]) expect(urls).toContain(`/${locale}${suffix}`);
  });

  it.each(LOCALES.flatMap(l => SUBPAGES.map(p => [l, p] as const)))("renders the frame's bands in its order (%s %s)", (locale, page) => {
    const html = render(locale, page);
    const middle = { prices: ["price-table", "faq"], guarantee: ["promises", "how-it-works"], about: ["crew", "service-area"] }[page];
    expect(bandsOf(html)).toEqual(["menu-toggle", "page-head", "proof", ...middle, "cta", "sticky"]);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    // No form of their own: every action goes to the home page's card.
    expect(html).not.toContain("<form");
    expect(html).toContain(`href="/${locale}#devis"`);
  });

  it.each(LOCALES)("link the header to every page and Reviews to the home band, the footer to the pages (%s)", locale => {
    const html = render(locale, "about");
    for (const href of [`/${locale}/prices`, `/${locale}/guarantee`, `/${locale}#avis`, `/${locale}/about`]) expect(html).toContain(`href="${href}"`);
    const footer = html.slice(html.indexOf('<footer id="footer"'));
    for (const href of [`/${locale}/prices`, `/${locale}/guarantee`, `/${locale}/about`]) expect(footer).toContain(`href="${href}"`);
    expect(footer).not.toContain(`href="/${locale}#avis"`);
  });

  it("switch language to the same page", () => {
    expect(render("fr", "prices")).toMatch(/<a href="\/en\/prices\?lang=en"[^>]*>English<\/a>/);
    expect(render("en", "guarantee")).toMatch(/<a href="\/fr\/guarantee\?lang=fr"[^>]*>Français<\/a>/);
  });

  it.each(LOCALES.flatMap(l => SUBPAGES.map(p => [l, p] as const)))("keep the frame's sample facts out of the structured data (%s %s)", (locale, page) => {
    const html = render(locale, page);
    const ld = jsonLd(html);
    expect(ld).not.toBe("[]");
    expect(ld).not.toMatch(/aggregateRating|"review"|telephone|555-0192|Boise|Meridian|hasMap|GeoCoordinates|PostalAddress/);
    expect(html).toContain(`href="${SAMPLE_PHONE.href}"`);
  });
});

describe("the prices page", () => {
  it("sets the four services in a real table, the caption for screen readers only", () => {
    const html = render("en", "prices");
    expect(html).toContain('<caption class="sr-only">What each clean costs</caption>');
    expect(html.match(/<th role="rowheader" scope="row"/g)).toHaveLength(4);
    for (const amount of ["$89", "$179", "$149", "Custom quote"]) expect(html).toContain(amount);
    expect(html.match(/Most popular/g)).toHaveLength(1);
    // What each includes is the home card's list; the phone drops the column.
    expect(html).toContain("Kitchen surfaces &amp; appliance exteriors · Bathrooms scrubbed");
    expect(html).toMatch(/<th role="columnheader" scope="col" class="hidden [^"]*md:table-cell[^"]*">What&#x27;s included<\/th>/);
  });
});

describe("the guarantee page", () => {
  it("answers four worries and lists its steps as an ordered list", () => {
    const html = render("en", "guarantee");
    expect(html.match(/<li class="flex flex-col gap-4 rounded-2xl/g)).toHaveLength(4);
    expect(html).toMatch(/<ol\b[^>]*>(?:(?!<\/ol>).)*Request a quote\.(?:(?!<\/ol>).)*Your team arrives\.(?:(?!<\/ol>).)*Pay once you’re satisfied\./s);
  });
});

describe("the about page", () => {
  it("names the frame's crew and towns, and keeps the map behind a button hidden on a phone", () => {
    const html = render("en", "about");
    for (const name of ["Ana R.", "Luis M.", "Hannah K.", "Dev P."]) expect(html).toContain(name);
    for (const town of ["Boise", "Meridian", "Eagle", "Nampa", "Caldwell"]) expect(html).toContain(`>${town}</li>`);
    // Nothing from Google until the click: a button, no iframe.
    expect(html).toContain("Show the map");
    expect(html).not.toContain("<iframe");
    // The Mobile frame has no map.
    expect(html).toMatch(/<div class="[^"]*\bhidden\b[^"]*\bmd:block\b[^"]*" data-state="idle"><button type="button"/);
  });
});
