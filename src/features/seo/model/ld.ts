import { ldCompact, localBusiness, type JsonLdNode } from "@evinvest/marketing";
import type { Copy } from "@/entities/content";
import type { Place, ServiceArea } from "@/entities/place";
import type { SITE } from "@/shared/config/site";
import { siteOrigin } from "@/shared/landing";

type AnySite = Pick<typeof SITE, "brand">;

function areaServed(areas: readonly ServiceArea[] | null): JsonLdNode[] | undefined {
  return areas?.flatMap((area): JsonLdNode[] =>
    area.kind === "localities"
      ? area.names.map(name => ({ "@type": "City", name }))
      : [
          {
            "@type": "GeoCircle",
            geoMidpoint: { "@type": "GeoCoordinates", latitude: area.center.lat, longitude: area.center.lng },
            geoRadius: area.km * 1000,
          },
        ],
  );
}

function openingHours(place: Place<string>): JsonLdNode[] | undefined {
  return place.hours?.map(h => ({ "@type": "OpeningHoursSpecification", dayOfWeek: h.days, opens: h.opens, closes: h.closes }));
}

/**
 * The business, derived from the place and never authored. A storefront names
 * its address; a service-area business names where it goes instead, and has
 * no `address`, `geo` or map to name — Google's own guidance for SABs, and the
 * only honest shape for a business without a door.
 */
export function businessNode(site: AnySite, place: Place<string>): JsonLdNode {
  const origin = siteOrigin(site);
  const base = {
    id: origin === null ? undefined : `${origin}/#business`,
    type: site.brand.businessType,
    name: place.gbpName,
    url: origin ?? undefined,
    telephone: place.channels.phone ?? site.brand.phone ?? undefined,
    email: site.brand.email ?? undefined,
  };
  const extra = ldCompact({
    priceRange: site.brand.priceRange,
    areaServed: areaServed(place.serviceArea),
    openingHoursSpecification: openingHours(place),
  });
  const { presence } = place;
  if (presence.kind === "service-area") return localBusiness(base, extra);
  return localBusiness(
    {
      ...base,
      image: presence.storefrontPhoto ?? undefined,
      address: {
        streetAddress: presence.address.street,
        postalCode: presence.address.postalCode,
        addressLocality: presence.address.locality,
        addressRegion: presence.address.region,
        addressCountry: presence.address.country,
      },
      geo: presence.geo ?? undefined,
    },
    extra,
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
