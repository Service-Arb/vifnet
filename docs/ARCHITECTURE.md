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

## Leads reach the panel

Each lead also goes to the Service-Arb panel as one `lead.created` event
(`sa.funnel.v1`, built in `src/shared/lib/funnel-event.ts`): queued in the
leads file before the visitor is thanked, signed, and retried from there.
`LEAD_WEBHOOK_URL`, `LEAD_WEBHOOK_KEY_ID` and `LEAD_WEBHOOK_SECRET` come from
the container's Secret, all three or none; without the URL the webhook is off,
which is why it is not in `deploy/config.nix`.

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
named reviews, US prices. That content lives in the
copy (`src/entities/content`) and `shared/config/sample.ts`, never in `site`
or `assets/card.toml`, so no JSON-LD, OG card or notification carries it
(`tests/site.test.ts`). The frame's sample phone number is the exception: it
is not shown at all. The number is the place's own, from the panel's place
source (`LOCATIONS_API_URL`): every surface reads `phoneLink(copy.f.phone)`
and renders its number only when there is one, and the card offers the call
(`tests/live-place.test.ts`); without one, no `tel:` link appears anywhere. OWNER_TODO "design sample content" blocks a launch
until the owner replaces it. The terms an earlier design proposed and the
frame does not state are still `copy:` lines, and a test fails if one
appears in the copy.

## The sub-pages

`/prices`, `/guarantee` and `/about` are the Figma file's sub-page frames
(Prices 41:1627, Guarantee 40:1428, About 42:1910), listed once in
`site.pages` — the proxy, the route tree, the sitemap and the nav read that
list. They are one view (`views/subpage`), as aquafix's `LocationSubpage`:
the home page's header, a `PageHead` with the proof card beside it from `lg`,
the page's bands, the gold band, the footer and the sticky bar. They carry no
form: every action lands on the home page's quote card (`#devis`). The
header and footer links are `shared/config/nav.ts`. The About page's crew,
towns and map are the frame's sample (OWNER_TODO "design sample content"):
the chips and the click-to-load map are kitstart's `AreaChips` and
`MapFacade`, fed from the copy and `shared/config/sample.ts`, never from the
place, which still names no commune and has no address to map.

## Pages stay cached, and work without JavaScript

Place pages are ISR (`revalidate = 600`): no page reads the request, the link
mode rides in the `[location]` param — and so does the home page's A/B
bucket (`_vifnet~lead_layout.b`, docs/EXPERIMENTS.md), which the proxy
writes from the visitor's `ab_<key>` cookie. The quote form is kitstart's
`LeadCapture` — the form every Service-Arb brand shares, drawn as the frame's
card through its `className` and `classNames`, with the frame's placeholders
(the labels are for assistive technology only) — and a plain POST answered
with a 303, so it submits before any script loads; with one, it says done in
the card (Figma QuoteCard Done). It is the hero's card, the one place every
CTA points at (`#devis`), with its "call me back" (`#devis-callback`) folded
to one line under it.
A service card's link names its service (`data-need`), so the card does not
ask it again. The quote card, the sticky bar's reveal, the phone menu's
closer and, on the About page, kitstart's map facade are the only client
islands, and the page reads the same without them: `qualify-first` shows
the contact once a service's radio is checked (`:has`), the callback is a
`<details>`, the phone menu is a checkbox the burger toggles, the script
only closes it after a link or on Esc. The selects are kitstart's
`FormSelect`: a native `<select>` without a script, the kit's list once the
page hydrates — never a bare `NativeSelect`, whose popup is the platform's
menu.
