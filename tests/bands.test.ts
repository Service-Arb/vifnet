import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { copyFor } from "@/entities/content";
import type { Locale } from "@/shared/config/i18n";
import { Guarantee } from "@/widgets/guarantee";
import { Reviews } from "@/widgets/reviews";
import { Services } from "@/widgets/services";
import { Stats } from "@/widgets/stats";

// The bands of the Figma frame always render, as static content: the frame's
// sample figures, reviews and prices (OWNER_TODO "design sample content").
const copy = (locale: Locale) => copyFor(locale, { place: "Vifnet", phone: null });
const html = (el: ReturnType<typeof createElement>) => renderToStaticMarkup(el);
const quote = { href: "/fr#devis", form: "quote" };

describe("the stats band", () => {
  it.each([
    ["en", ["500+", "4.9★", "100%", "&lt; 2 hr"]],
    ["fr", ["500+", "4,9★", "100 %", "&lt; 2 h"]],
  ] as const)("prints the frame's four figures (%s)", (locale, figures) => {
    const out = html(createElement(Stats, { copy: copy(locale) }));
    for (const figure of figures) expect(out).toContain(figure);
    expect(out).toContain('data-band="stats"');
  });
});

describe("the services band", () => {
  it("prints the four cards with their prices, the featured one badged", () => {
    const out = html(createElement(Services, { copy: copy("en"), id: "prestations", quote }));
    for (const name of ["Standard Clean", "Deep Clean", "Move-In / Move-Out", "Post-Construction"]) expect(out).toContain(name);
    for (const price of ["From $89", "From $179", "From $149", "Custom quote"]) expect(out).toContain(price);
    expect(out.match(/Most popular/g)).toHaveLength(1);
    // Every card leads to the form.
    expect(out.match(/href="\/fr#devis"/g)?.length).toBeGreaterThanOrEqual(4);
  });
});

describe("the reviews band", () => {
  it.each(["fr", "en"] as const)("prints all six reviews, three with photos (%s)", locale => {
    const out = html(createElement(Reviews, { copy: copy(locale), id: "avis", quoteHref: quote.href }));
    expect(out.match(/<article/g)).toHaveLength(6);
    expect(out).toContain(locale === "fr" ? "4,9 de moyenne" : "4.9 average");
    // Result photo and job photo on each of the three: two `<picture>`s a card.
    expect(out.match(/<picture/g)).toHaveLength(6);
  });

  it("keeps the frame's column order: Amanda, Jordan · Marcus & Deb, Keisha · Priya, Carl", () => {
    const out = html(createElement(Reviews, { copy: copy("en"), id: "avis", quoteHref: quote.href }));
    const order = ["Amanda R.", "Jordan T.", "Marcus &amp; Deb F.", "Keisha M.", "Priya S.", "Carl B."].map(n => out.indexOf(n));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
});

describe("the guarantee band", () => {
  it("states the frame's promise", () => {
    expect(html(createElement(Guarantee, { copy: copy("en") }))).toContain("100% Satisfaction Guarantee");
  });
});
