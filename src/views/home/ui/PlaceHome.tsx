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
import { QuoteCard } from "@/widgets/quote-card";
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
  /** The quote card in the hero: every CTA lands here. */
  quote: "devis",
  /** The gold band at the end, which sends back up to the form. */
  closing: "demande",
} as const;

const FORM_ID = "quote";

/** The call bar's phone and WhatsApp as the frame's ghost buttons (white/10 on forest); the quote stays gold. */
const CALL_BAR_GHOST = "border-0 bg-secondary text-on-secondary shadow-none hover:bg-secondary/80 hover:text-on-secondary";

/**
 * The home page, in the order of the Figma frame (Cleaning site 9:107 /
 * 14:502). The form sits in the hero, on the frame's quote card. Bands
 * without confirmed content — stats, prices, reviews, the guarantee, the
 * service area — render nothing until the owner's facts arrive, and the page
 * closes up around them.
 */
export function PlaceHome({ view, copy, renderedAt }: { view: PlaceView<Locale>; copy: Copy; renderedAt: number }) {
  const { t, f } = copy;
  const now = new Date(renderedAt);
  const contact = contactOf(site, view.place);
  const rating = freshRating(view.place, now);
  const at = (id: string) => view.href(`#${id}`);
  const quoteHref = at(SECTION_IDS.quote);
  const quote = { href: quoteHref, form: FORM_ID };
  // A band without facts renders nothing, so it gets no link either.
  const links = [
    { href: at(SECTION_IDS.services), label: t.nav.services },
    { href: at(SECTION_IDS.work), label: t.nav.work },
    ...(PRICES ? [{ href: at(SECTION_IDS.prices), label: t.priceTable.title }] : []),
    { href: at(SECTION_IDS.steps), label: t.nav.steps },
    ...(rating ? [{ href: at(SECTION_IDS.reviews), label: t.reviews.title }] : []),
    { href: at(SECTION_IDS.faq), label: t.nav.faq },
  ];
  const graph = placeGraph(site, view, "home", { placeName: f.place, title: t.pages.home.title(f), description: t.pages.home.description(f) }, now);
  const lang = { langHrefs: perLocale(site, l => view.href("", l)), locales: site.i18n.locales, labels: site.i18n.labels };
  return (
    <>
      <JsonLd data={graph} />
      <JsonLd data={faqPageNode(t.faqs)} />
      <SiteHeader copy={copy} home={view.href("")} quoteHref={quoteHref} links={links} phone={contact.phone} {...lang} />
      <main>
        <Hero
          copy={copy}
          workHref={at(SECTION_IDS.work)}
          quote={quote}
          rating={rating}
          form={<QuoteCard copy={copy} id={SECTION_IDS.quote} placeSlug={view.place.slug} renderedAt={renderedAt} formId={FORM_ID} />}
        />
        <Services copy={copy} id={SECTION_IDS.services} quote={quote} />
        <PriceTable copy={copy} id={SECTION_IDS.prices} prices={PRICES} />
        <BeforeAfter copy={copy} id={SECTION_IDS.work} />
        <Reviews copy={copy} id={SECTION_IDS.reviews} rating={rating} />
        <HowItWorks copy={copy} id={SECTION_IDS.steps} />
        <ServiceArea copy={copy} id={SECTION_IDS.area} place={view.place} />
        <FaqBand copy={copy} id={SECTION_IDS.faq} />
        <Closing copy={copy} id={SECTION_IDS.closing} quoteHref={quoteHref} phone={contact.phone} />
      </main>
      <SiteFooter copy={copy} year={now.getFullYear()} {...lang} />
      <CallBar
        id="callbar"
        label={t.contactLabel}
        copy={copy}
        phone={contact.phone}
        whatsapp={contact.whatsapp}
        quoteHref={quoteHref}
        className="dark border-border bg-background/95 backdrop-blur-sm"
        buttonClassName="rounded-sm text-sm font-bold"
        classNames={{ call: CALL_BAR_GHOST, whatsapp: CALL_BAR_GHOST }}
      />
    </>
  );
}
