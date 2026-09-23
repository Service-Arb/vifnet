import type { Metadata } from "next";
import type { Copy } from "@/entities/content";
import { isPublished, type Place } from "@/entities/place";
import { OG_LOCALE } from "@/shared/config/i18n";
import type { Page, SITE } from "@/shared/config/site";
import { siteOrigin } from "@/shared/landing";

type AnySite = Pick<typeof SITE, "brand" | "i18n" | "pages" | "publication">;

/**
 * `noindex, nofollow` until the place is published — which, without a domain,
 * it never is. There is no canonical to point at before there is a domain, so
 * canonical, `hreflang` and `og:url` are left out rather than pointed at a
 * preview host.
 */
export function pageMetadata(site: AnySite, place: Place<string>, copy: Copy, page: Page): Metadata {
  const { title, description } = copy.t.pages[page];
  const origin = siteOrigin(site);
  const suffix = site.pages[page];
  const url = origin === null ? null : `${origin}/${copy.locale}${suffix}`;
  return {
    title,
    description,
    robots: isPublished(place, site.publication, site.brand) ? { index: true, follow: true } : { index: false, follow: false },
    ...(origin !== null && url !== null
      ? { alternates: { canonical: url, languages: site.i18n.languageAlternates(suffix || "/", origin) } }
      : {}),
    openGraph: {
      type: "website",
      siteName: site.brand.name,
      title,
      description,
      locale: OG_LOCALE[copy.locale],
      ...(url === null ? {} : { url }),
    },
  };
}

/** Status pages are never indexed, whatever the site's state. */
export function statusMetadata(site: Pick<typeof SITE, "brand">, title: string): Metadata {
  return { title: `${title} · ${site.brand.name}`, robots: { index: false, follow: false } };
}
