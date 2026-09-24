# Architecture

A Next.js App Router site in Feature-Sliced layers on `@evinvest/kitstart`, the
machinery of the Service-Arb landing family (its design:
`LANDING-ARCHITECTURE.md` in the Service-Arb workspace). The package owns the
behaviour — routing, the place model and publication gate, the lead funnel and
store, JSON-LD, sitemap and robots, the structural widgets (language switch,
call bar, commune chips, FAQ, status screens, the form's headless shell).
This repo owns what Vifnet looks and sounds like.

## One composition root

`src/shared/config/site.ts` builds the one `site` object every brand fact is
read from: the brand, the locales, the topology (one place, served at the
apex), the pages, the places, the publication policy and the lead schema. The
contact facts come from `assets/card.toml`, inlined at build.

## A place without an address

Vifnet goes to its customers. Its place is a `service-area` presence, which
has no field an address, a coordinate or a map could be written into, and the
JSON-LD names `areaServed` communes, never `address` or `geo`. The copy names
no street or premises either (`tests/content.test.ts`).

## Nothing is indexable yet

A page is indexable only when the place passes the publication gate (where the
crew goes and when it works) *and* the site has a domain. Until then every
page is `noindex`, `robots.txt` disallows everything and the sitemap is empty.
`OWNER_TODO` lists the missing facts; a domain set while a launch-blocking one
is open fails the build.

## Only confirmed words

The design proposes terms the company would be held to — a fixed price, the
supplies, a re-clean, keys, office hours. None is on the page until the owner
confirms it: each is an `OWNER_TODO` "copy:" line, and a test fails if one
appears in the copy. Bands whose facts do not exist yet (prices, reviews, the
service area) render nothing; the page closes up around them.

## Pages stay cached, and work without JavaScript

Place pages are ISR (`revalidate = 600`): no page reads the request, the link
mode rides in the `[location]` param. The quote form is a plain POST answered
with a 303, so it submits before any script loads; the service links and the
before/after slider are the only client islands, and the page reads the same
without them.
