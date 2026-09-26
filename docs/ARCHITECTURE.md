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

## The frame, and what holds its sample content back

The home page is the Figma frame (`1wXlPmnmOdKYPDWz6N5EB8`, Desktop 1440 /
Mobile 390) verbatim, its sample content included: the rating, the stats, six
named reviews, US prices, a fictional phone number. That content lives in the
copy (`src/entities/content`) and `shared/config/sample.ts`, never in `site`
or `assets/card.toml`, so no JSON-LD, OG card or notification carries it
(`tests/site.test.ts`). OWNER_TODO "design sample content" blocks a launch
until the owner replaces it. The terms an earlier design proposed and the
frame does not state are still `copy:` lines, and a test fails if one
appears in the copy.

## Pages stay cached, and work without JavaScript

Place pages are ISR (`revalidate = 600`): no page reads the request, the link
mode rides in the `[location]` param. The quote form is a plain POST answered
with a 303, so it submits before any script loads; it sits on the hero's
card, the one place every CTA points at (`#devis`). The quote card's
steps, the service cards' links, the sticky bar's reveal and the phone menu's
closer are the only client islands, and the page reads the same without
them: the card is one form (`@media (scripting: none)`), the phone menu is a
checkbox the burger toggles, the script only closes it after a link or on
Esc. The selects are kitstart's `FormSelect`: a native `<select>` without a
script, the kit's list once the page hydrates — never a bare
`NativeSelect`, whose popup is the platform's menu.
