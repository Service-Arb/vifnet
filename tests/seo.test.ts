import { describe, expect, it } from "vitest";
import { copyFor } from "@/entities/content";
import { PLACE, type Place } from "@/entities/place";
import { businessNode, pageGraph, pageMetadata, robotsFor, sitemapFor } from "@/features/seo";
import type { Locale } from "@/shared/config/i18n";
import { SITE } from "@/shared/config/site";

/** The place as it will be once the owner has said where and when the crew works. */
const READY: Place<Locale> = {
  ...PLACE,
  serviceArea: [{ kind: "localities", names: ["Paris 15e", "Issy-les-Moulineaux"] }],
  hours: [{ days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "19:00" }],
};
const LAUNCHED = { ...SITE, brand: { ...SITE.brand, domain: "vifnet.example" } };

describe("JSON-LD of a service-area business", () => {
  it("names no address, geo or map — the site as it is", () => {
    const node = businessNode(SITE, PLACE);
    expect(node["@type"]).toBe("LocalBusiness");
    for (const key of ["address", "geo", "hasMap", "latitude", "longitude"]) expect(node).not.toHaveProperty(key);
  });

  it("says where the crew goes instead, once it is known", () => {
    const node = businessNode(LAUNCHED, READY);
    expect(node).not.toHaveProperty("address");
    expect(node).not.toHaveProperty("geo");
    expect(node.areaServed).toEqual([
      { "@type": "City", name: "Paris 15e" },
      { "@type": "City", name: "Issy-les-Moulineaux" },
    ]);
    expect(node.url).toBe("https://vifnet.example");
  });

  it("carries no address anywhere in the page graph", () => {
    const json = JSON.stringify(pageGraph(SITE, PLACE, copyFor("fr")));
    expect(json).not.toMatch(/PostalAddress|streetAddress|postalCode|GeoCoordinates|hasMap/);
  });
});

describe("without a domain", () => {
  it.each(["fr", "en"] as const)("the %s page is noindex, nofollow and names no canonical", locale => {
    const meta = pageMetadata(SITE, READY, copyFor(locale), "home");
    expect(SITE.brand.domain).toBeNull();
    expect(meta.robots).toEqual({ index: false, follow: false });
    expect(meta.alternates).toBeUndefined();
    expect(meta.openGraph).not.toHaveProperty("url");
  });

  it("robots.txt disallows everything and names no sitemap", () => {
    expect(robotsFor(SITE)).toEqual({ rules: [{ userAgent: "*", disallow: "/" }] });
  });

  it("the sitemap is empty even for a place that passes the gate", () => {
    expect(sitemapFor(SITE, READY)).toEqual([]);
  });
});

describe("with a domain", () => {
  it("an unfinished place stays noindex and out of the sitemap", () => {
    expect(pageMetadata(LAUNCHED, PLACE, copyFor("fr"), "home").robots).toEqual({ index: false, follow: false });
    expect(sitemapFor(LAUNCHED, PLACE)).toEqual([]);
  });

  it("a place that passes the gate is indexed and listed in both languages", () => {
    expect(pageMetadata(LAUNCHED, READY, copyFor("en"), "home").robots).toEqual({ index: true, follow: true });
    expect(sitemapFor(LAUNCHED, READY).map(entry => entry.url)).toEqual([
      "https://vifnet.example/fr",
      "https://vifnet.example/en",
    ]);
    expect(robotsFor(LAUNCHED).sitemap).toBe("https://vifnet.example/sitemap.xml");
  });
});
