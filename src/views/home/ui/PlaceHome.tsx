import { contactOf, faqPageNode, freshRating, perLocale, placeGraph, type PlaceView } from "@evinvest/kitstart";
import { CallBar, JsonLd } from "@evinvest/kitstart/react";
import type { Copy } from "@/entities/content";
import type { Locale } from "@/shared/config/i18n";
import { PRICES } from "@/shared/config/prices";
import { site } from "@/shared/config/site";
import { BeforeAfter } from "@/widgets/before-after";
import { Closing } from "@/widgets/closing";
import { FaqBand } from "@/widgets/faq";
import { Hero } from "@/widgets/hero";
import { HowItWorks } from "@/widgets/how-it-works";
import { PriceTable } from "@/widgets/price-table";
import { Reviews } from "@/widgets/reviews";
import { ServiceArea } from "@/widgets/service-area";
import { Services } from "@/widgets/services";
import { SiteFooter } from "@/widgets/site-footer";
import { SiteHeader } from "@/widgets/site-header";

/** The anchors the page links to, and the e2e sections are shot by. */
export const SECTION_IDS = {
  work: "avant-apres",
  services: "prestations",
  prices: "tarifs",
  steps: "etapes",
  reviews: "avis",
  area: "zone",
  faq: "faq",
  quote: "devis",
} as const;

const FORM_ID = "quote";

/**
 * The home page, in the order of the Figma frame (Home 7-2 / 8-238). Bands
 * without confirmed content — prices, reviews, the service area — render
 * nothing until the owner's facts arrive, and the page closes up around them.
 */
export function PlaceHome({ view, copy, renderedAt }: { view: PlaceView<Locale>; copy: Copy; renderedAt: number }) {
  const { t, f } = copy;
  const now = new Date(renderedAt);
  const contact = contactOf(site, view.place);
  const quoteHref = view.href(`#${SECTION_IDS.quote}`);
  const graph = placeGraph(site, view, "home", { placeName: f.place, title: t.pages.home.title(f), description: t.pages.home.description(f) }, now);
  const lang = { langHrefs: perLocale(site, l => view.href("", l)), locales: site.i18n.locales, labels: site.i18n.labels };
  return (
    <>
      <JsonLd data={graph} />
      <JsonLd data={faqPageNode(t.faqs)} />
      <SiteHeader copy={copy} home={view.href("")} quoteHref={quoteHref} {...lang} />
      <main>
        <Hero copy={copy} quoteHref={quoteHref} workHref={view.href(`#${SECTION_IDS.work}`)} />
        <BeforeAfter copy={copy} id={SECTION_IDS.work} />
        <Services copy={copy} id={SECTION_IDS.services} quote={{ href: quoteHref, form: FORM_ID }} />
        <PriceTable copy={copy} id={SECTION_IDS.prices} prices={PRICES} />
        <HowItWorks copy={copy} id={SECTION_IDS.steps} />
        <Reviews copy={copy} id={SECTION_IDS.reviews} rating={freshRating(view.place, now)} />
        <ServiceArea copy={copy} id={SECTION_IDS.area} place={view.place} />
        <FaqBand copy={copy} id={SECTION_IDS.faq} />
        <Closing copy={copy} id={SECTION_IDS.quote} placeSlug={view.place.slug} renderedAt={renderedAt} formId={FORM_ID} />
      </main>
      <SiteFooter copy={copy} year={now.getFullYear()} {...lang} />
      <CallBar id="callbar" label={t.contactLabel} copy={copy} phone={contact.phone} whatsapp={contact.whatsapp} quoteHref={quoteHref} buttonClassName="font-medium" />
    </>
  );
}
