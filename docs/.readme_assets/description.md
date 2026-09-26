The landing site of Vifnet, a cleaning business in France that works at the
customer's address and has no storefront of its own.

A Next.js app on [`@evinvest/kitstart`](https://github.com/EV-invest/lib/tree/main/ts/kitstart),
the machinery the Service-Arb landings share (routing, the place model and its
publication gate, the quote form and its lead store, SEO), built to the Figma
file `1wXlPmnmOdKYPDWz6N5EB8`, band for band: header, hero with the quote
card, stats, services, reviews, guarantee, FAQ, the gold CTA band, footer and
the sticky bar. French by default, English beside it.

There is no domain and no public phone number yet, so every page is `noindex`,
`robots.txt` disallows everything, the sitemap is empty and the quote form is
the only channel. The facts still missing are listed once, in `OWNER_TODO`
(`src/shared/config/site.ts`); giving the site a domain while a launch-blocking
one is open fails the build. One of them is the design's sample content — the
rating, the reviews, the prices, the phone number and the stock photos the
page shows as the Figma file has them — which the owner replaces before a
launch.
