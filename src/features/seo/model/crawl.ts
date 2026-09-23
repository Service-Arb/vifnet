import type { MetadataRoute } from "next";
import { isPublished, type Place } from "@/entities/place";
import type { SITE } from "@/shared/config/site";
import { siteOrigin } from "@/shared/landing";

type AnySite = Pick<typeof SITE, "brand" | "i18n" | "pages" | "publication">;

/**
 * Before a domain, crawling is refused outright: whatever host serves the site
 * now is not its home, and nothing it serves should be fetched, let alone
 * indexed. After, everything is allowed and `noindex` holds back what is not
 * ready — a crawler has to fetch a page to read its `noindex`.
 */
export function robotsFor(site: Pick<typeof SITE, "brand">): MetadataRoute.Robots {
  const origin = siteOrigin(site);
  if (origin === null) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return { rules: [{ userAgent: "*", allow: "/" }], sitemap: `${origin}/sitemap.xml` };
}

/**
 * Every page in every language, each its own `<url>` naming the whole
 * language cluster. Empty until the place is published: an unpublished page
 * listed here would be an invitation to index what says `noindex`.
 */
export function sitemapFor(site: AnySite, place: Place<string>): MetadataRoute.Sitemap {
  const origin = siteOrigin(site);
  if (origin === null || !isPublished(place, site.publication, site.brand)) return [];
  return Object.values<string>(site.pages).flatMap(suffix => {
    const languages = site.i18n.languageAlternates(suffix || "/", origin);
    return site.i18n.locales.map(locale => ({ url: `${origin}/${locale}${suffix}`, alternates: { languages } }));
  });
}
