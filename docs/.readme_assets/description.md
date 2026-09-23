The landing site of Vifnet, a cleaning business in France that works at the
customer's address and has no storefront of its own.

A Next.js app on [`@evinvest/kitstart`](https://github.com/EV-invest/lib/tree/main/ts/kitstart),
the machinery the Service-Arb landings share (routing, the place model and its
publication gate, the quote form and its lead store, SEO), built to the Figma
file `11BVyibSdB8fBYrfBiLX3C`. What is Vifnet's own is the copy, the palette,
the lock-up and the sections: hero, before/after, services, how it works,
FAQ, the quote band.

There is no domain and no public phone number yet, so every page is `noindex`,
`robots.txt` disallows everything, the sitemap is empty and the quote form is
the only channel. The facts still missing — and every term the design proposes
that the owner has not confirmed — are listed once, in `OWNER_TODO`
(`src/shared/config/site.ts`); giving the site a domain while a launch-blocking
one is open fails the build. The price table, the reviews and the service-area
chips render nothing until their facts exist.
