import { ldCompact, localBusiness, type JsonLdNode } from "@evinvest/marketing";
import type { Copy } from "@/entities/content";
import type { Place, ServiceArea } from "@/entities/place";
import type { SITE } from "@/shared/config/site";
import { siteOrigin } from "@/shared/landing";

type AnySite = Pick<typeof SITE, "brand">;

/** Named communes only — `ServiceArea` has no coordinates to leak. */
function areaServed(areas: readonly ServiceArea[] | null): JsonLdNode[] | undefined {
  return areas?.flatMap(area => area.names.map(name => ({ "@type": "City", name })));
}

function openingHours(place: Place<string>): JsonLdNode[] | undefined {
  return place.hours?.map(h => ({ "@type": "OpeningHoursSpecification", dayOfWeek: h.days, opens: h.opens, closes: h.closes }));
}

/**
 * The business, derived from the place and never authored. A service-area
 * business names where it goes, and has no `address`, `geo` or map to name —
 * Google's own guidance for SABs, and the only honest shape for a business
 * without a door.
 */
export function businessNode(site: AnySite, place: Place<string>): JsonLdNode {
  const origin = siteOrigin(site);
  return localBusiness(
    {
      id: origin === null ? undefined : `${origin}/#business`,
      type: site.brand.businessType,
      name: place.gbpName,
      url: origin ?? undefined,
      telephone: place.channels.phone ?? site.brand.phone ?? undefined,
      email: site.brand.email ?? undefined,
    },
    ldCompact({
      priceRange: site.brand.priceRange,
      areaServed: areaServed(place.serviceArea),
      openingHoursSpecification: openingHours(place),
    }),
  );
}

/** The page's `@graph`. Grows with the pages; today the business is all there is to say. */
export function pageGraph(site: AnySite, place: Place<string>, copy: Copy): JsonLdNode {
  const origin = siteOrigin(site);
  const page = ldCompact({
    "@type": "WebPage",
    url: origin === null ? undefined : `${origin}/${copy.locale}`,
    name: copy.t.pages.home.title,
    description: copy.t.pages.home.description,
    inLanguage: copy.locale,
  });
  return { "@context": "https://schema.org", "@graph": [businessNode(site, place), page] };
}
