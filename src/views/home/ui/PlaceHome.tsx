import { contactOf, faqPageNode, placeGraph, type AnalyticsTarget, type PlaceView, type PricingModel } from "@evinvest/kitstart";
import { JsonLd } from "@evinvest/kitstart/react";
import type { Copy } from "@/entities/content";
import { ExperimentScope } from "@/features/experiment";
import { BOOKING_ARMS, EXPERIMENTS, LEAD_LAYOUTS } from "@/shared/config/experiments";
import type { Locale } from "@/shared/config/i18n";
import { ANCHORS, placeNav } from "@/shared/config/nav";
import { site } from "@/shared/config/site";
import type { Assignment } from "@/shared/lib/experiments";
import { fromPrices } from "@/shared/lib/from-price";
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

export interface PlaceHomeProps {
  view: PlaceView<Locale>;
  copy: Copy;
  renderedAt: number;
  /** The price list the quote card prices estimates from, and the service cards start theirs at: the panel's, else the baked one. */
  pricing: PricingModel | null;
  /** The bucket this render is (the path's, never the request's) and where its events go. */
  experiments: { assignment: Assignment; target: AnalyticsTarget };
}

/**
 * The home page: the Figma frame (Desktop 1440 9:107, Mobile 390 14:502) and
 * nothing else, in its order. The structured data is built from `site` and
 * the place only — never from the frame's sample rating, reviews or phone.
 */
export function PlaceHome({ view, copy, renderedAt, pricing, experiments }: PlaceHomeProps) {
  const { t, f } = copy;
  const now = new Date(renderedAt);
  const nav = placeNav(view, t.nav, site.pages.home);
  const graph = placeGraph(site, view, "home", { placeName: f.place, title: t.pages.home.title(f), description: t.pages.home.description(f) }, now);
  const variant = experiments.assignment.lead_layout;
  const running = EXPERIMENTS.lead_layout.enabled;
  const booking = experiments.assignment.booking_provider;
  const bookingRunning = EXPERIMENTS.booking_provider.enabled;
  return (
    <>
      <JsonLd data={graph} />
      <JsonLd data={faqPageNode(t.faqs)} />
      <ExperimentScope
        target={experiments.target}
        placeSlug={view.place.slug}
        experiment="lead_layout"
        variant={variant}
        enabled={running}
      >
        {/* Its own exposures and contacts, so `npm run ab:report` reads both tests alike. */}
        <ExperimentScope
          target={experiments.target}
          placeSlug={view.place.slug}
          experiment="booking_provider"
          variant={booking}
          enabled={bookingRunning}
        >
          <SiteHeader copy={copy} home={view.href("")} quoteHref={nav.quoteHref} links={nav.header} />
          <main>
            <Hero
              copy={copy}
              form={
                <QuoteCard
                  copy={copy}
                  id={SECTION_IDS.quote}
                  place={view.place}
                  contact={contactOf(site, view.place)}
                  renderedAt={renderedAt}
                  pricing={pricing}
                  layout={LEAD_LAYOUTS[variant]}
                  experiment={running ? { name: "lead_layout", variant } : undefined}
                  bookingVariant={bookingRunning ? BOOKING_ARMS[booking] : null}
                />
              }
            />
            <Stats copy={copy} />
            <Services copy={copy} id={SECTION_IDS.services} quoteHref={nav.quoteHref} from={fromPrices(pricing)} />
            <Reviews copy={copy} id={SECTION_IDS.reviews} quoteHref={nav.quoteHref} />
            <Guarantee copy={copy} />
            <FaqBand copy={copy} id={SECTION_IDS.faq} />
            <Closing copy={copy} id={SECTION_IDS.closing} quoteHref={nav.quoteHref} />
          </main>
          <SiteFooter copy={copy} year={now.getFullYear()} links={nav.footer} other={nav.other} />
          {/* Room under the footer for the sticky bar, on the footer's colour. */}
          <div aria-hidden="true" className="dark h-14 bg-popover" />
          <StickyBar copy={copy} quoteHref={nav.quoteHref} />
        </ExperimentScope>
      </ExperimentScope>
    </>
  );
}
