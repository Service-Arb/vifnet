# Architecture

A Next.js App Router site in Feature-Sliced layers, on the same machinery as
[aquafix](https://github.com/Service-Arb/aquafix). The design of the landing
family it belongs to is `LANDING-ARCHITECTURE.md` in the Service-Arb workspace.

## One composition root

`src/shared/config/site.ts` builds the one `SITE` object every brand fact is
read from: the brand, the locales, the topology (one place, no subdomains), the
pages, the places, the publication policy and the lead schema. Slices take it
as an argument rather than importing brand constants, so the same code serves
a site with or without a domain — which is how the tests exercise both.

## A place without an address

Vifnet goes to its customers. `Place.presence` is only `{ kind: "service-area" }`
and a service area is a list of named communes: there is no field a
placeholder address or a coordinate could be written into, and
`tests/place.test.ts` holds that at compile time. The storefront half of the
landing model belongs with a shared package, not here. The JSON-LD follows: the
business names `areaServed` cities, never `address`, `geo` or a map.

## Nothing is indexable yet

A page is indexable only when the place passes the publication gate
(`SERVICE_AREA_GATE`: where the crew goes and when it works) *and* the site
has a domain. Until then:

- every page is `noindex, nofollow` and names no canonical;
- `robots.txt` disallows everything;
- the sitemap is empty.

`OWNER_TODO` lists the missing facts; `assertLaunchable` fails the build if a
domain is set while a launch-blocking one is open.
