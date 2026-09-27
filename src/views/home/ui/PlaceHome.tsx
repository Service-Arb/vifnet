import { faqPageNode, placeGraph, type PlaceView } from "@evinvest/kitstart";
import { JsonLd } from "@evinvest/kitstart/react";
import type { Copy } from "@/entities/content";
import type { Locale } from "@/shared/config/i18n";
import { ANCHORS, placeNav } from "@/shared/config/nav";
import { site } from "@/shared/config/site";
import { Closing } from "@/widgets/closing";
import { FaqBand } from "@/widgets/faq";
import { Guarantee } from "@/widgets/guarantee";
import { Hero } from "@/widgets/hero";
import { QuoteCard } from "@/widgets/quote-card";
import { Reviews } from "@/widgets/reviews";
import { Services } from "@/widgets/services";
import { SiteFooter } from "@/widgets/site-footer";
import { SiteHeader } from "@/widgets/site-header";
import { Stats } from "@/widgets/stats";
import { StickyBar } from "@/widgets/sticky-bar";

/** The anchors the page links to, and the e2e sections are shot by. */
export const SECTION_IDS = {
  services: "prestations",
  reviews: ANCHORS.reviews,
  faq: "faq",
  /** The quote card in the hero: every CTA lands here, from every page. */
  quote: ANCHORS.quote,
  /** The gold band at the end, which sends back up to the form. */
  closing: "demande",
} as const;

const FORM_ID = "quote";

/**
 * The home page: the Figma frame (Desktop 1440 9:107, Mobile 390 14:502) and
 * nothing else, in its order. The structured data is built from `site` and
 * the place only — never from the frame's sample rating, reviews or phone.
 */
export function PlaceHome({ view, copy, renderedAt }: { view: PlaceView<Locale>; copy: Copy; renderedAt: number }) {
  const { t, f } = copy;
  const now = new Date(renderedAt);
  const nav = placeNav(view, t.nav, site.pages.home);
  const quote = { href: nav.quoteHref, form: FORM_ID };
  const graph = placeGraph(site, view, "home", { placeName: f.place, title: t.pages.home.title(f), description: t.pages.home.description(f) }, now);
  return (
    <>
      <JsonLd data={graph} />
      <JsonLd data={faqPageNode(t.faqs)} />
      <SiteHeader copy={copy} home={view.href("")} quoteHref={nav.quoteHref} links={nav.header} />
      <main>
        <Hero copy={copy} form={<QuoteCard copy={copy} id={SECTION_IDS.quote} placeSlug={view.place.slug} renderedAt={renderedAt} formId={FORM_ID} />} />
        <Stats copy={copy} />
        <Services copy={copy} id={SECTION_IDS.services} quote={quote} />
        <Reviews copy={copy} id={SECTION_IDS.reviews} quoteHref={nav.quoteHref} />
        <Guarantee copy={copy} />
        <FaqBand copy={copy} id={SECTION_IDS.faq} />
        <Closing copy={copy} id={SECTION_IDS.closing} quoteHref={nav.quoteHref} />
      </main>
      <SiteFooter copy={copy} year={now.getFullYear()} links={nav.footer} other={nav.other} />
      {/* Room under the footer for the sticky bar, on the footer's colour. */}
      <div aria-hidden="true" className="dark h-14 bg-popover" />
      <StickyBar copy={copy} quoteHref={nav.quoteHref} />
    </>
  );
}
