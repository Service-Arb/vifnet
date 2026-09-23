The landing site of Vifnet, a cleaning business in France that works at the
customer's address and has no storefront of its own.

This is the foundation, not the site: a Next.js app on the EV kit with one
placeholder page in French and English. There is no domain and no public phone
number yet, so every page is `noindex`, `robots.txt` disallows everything and
the sitemap is empty. The facts still missing are listed once, in `OWNER_TODO`
(`src/shared/config/site.ts`); giving the site a domain while a launch-blocking
one is open fails the build.

It follows the Service-Arb landing layout of
[aquafix](https://github.com/Service-Arb/aquafix), with one deliberate
difference: the business is modelled as a service area, so the type of a place
has no field an address could be written into.
