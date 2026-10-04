import type { BookingProvider, Place, PricingModel } from "@evinvest/kitstart";
import type { LeadCaptureLayout } from "@evinvest/kitstart/react";
import { leadCaptureText, type Copy } from "@/entities/content";
import { BEDROOMS, FLOWS, LEAD, PHOTO_NEEDS, SUBJECTS, type Subject } from "@/shared/config/lead";
import { BedroomsField, TrustLine } from "./fields";
import { LEAD_CAPTURE_LOOK } from "./look";
import { QuoteCapture } from "./QuoteCapture";

export interface QuoteCardProps {
  copy: Copy;
  /** The anchor every CTA on the page points at (`#devis`). */
  id: string;
  place: Place<string>;
  /** `contactOf(site, place)`: a `null` number is a channel the card does not offer. */
  contact: { phone: string | null; whatsapp: string | null };
  renderedAt: number;
  /** The price list an estimate is priced from live (the server prices it again); `null`: every job is a quote. */
  pricing: PricingModel | null;
  /** The job the page already knows, not asked again; `?need=` and a service card's `data-need` set it too. */
  need?: Subject | undefined;
  /** Experiment `lead_layout`'s switch: the need on the same screen, or first. */
  layout: LeadCaptureLayout;
  /** The assignment the card's events and its post carry; none when no test runs. */
  experiment: { name: string; variant: string } | undefined;
  /**
   * Experiment `booking_provider`'s arm as a provider: kitstart offers it after
   * a priced lead when the place has it, else the place's default (`bookingOf`);
   * `null` when the test is off.
   */
  bookingVariant: BookingProvider | null;
}

/**
 * The frame's QuoteCard (6:83): white, rounded-2xl, p-7, shadow-2xl — a light
 * island in the dark hero — drawn on kitstart's `LeadCapture` itself, the form
 * every Service-Arb brand shares so an experiment's results pool across them.
 * The heading, the placeholders (labels only for assistive technology) and
 * the Done state are the frame's; the fields, channels and events are the
 * kit's. No name field: the call back asks it, and every field costs leads. A service card names its service (`data-need`), so the card does not
 * ask it again. The card is `#<id>` (`#devis`), its form `#devis-form`, the
 * callback `#devis-callback`; the form posts `form_id=quote`, the kit's
 * default, so its events stay comparable across brands. A regular clean is
 * an estimate (`FLOWS`): its answers as tiles, the price live, "Réserver";
 * the other jobs are quotes, with photos on WhatsApp when the place has it.
 */
export function QuoteCard({ copy, id, place, contact, renderedAt, pricing, need, layout, experiment, bookingVariant }: QuoteCardProps) {
  const { t, locale } = copy;
  const text = leadCaptureText(t, locale);
  return (
    <QuoteCapture
      id={id}
      className="light rounded-2xl bg-background p-7 text-ink shadow-2xl"
      place={place}
      contact={contact}
      locale={locale}
      renderedAt={renderedAt}
      wire={LEAD.wire}
      needs={SUBJECTS.map(s => ({ value: s, label: t.services.items[s].name }))}
      flows={FLOWS}
      pricing={pricing}
      photos={PHOTO_NEEDS}
      need={need}
      layout={layout}
      extras={
        <BedroomsField
          label={`${t.quote.labels.bedrooms} (${text.optional})`}
          placeholder={t.quote.bedroomsPlaceholder}
          options={BEDROOMS.map(b => ({ value: b, label: t.quote.bedrooms[b] }))}
        />
      }
      experiment={experiment}
      bookingVariant={bookingVariant}
      text={text}
      labels="hidden"
      // Folded: the frame's card has no callback, so it is one quiet line
      // until asked for — even when the place is closed and it would lead.
      callbackOpen={false}
      head={
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-2xl leading-8 font-bold text-brand">{t.quoteForm.title}</h2>
          <p className="text-sm leading-5 text-ink-soft">{t.quoteForm.lede}</p>
        </div>
      }
      trust={<TrustLine lines={t.quote.trust} />}
      classNames={LEAD_CAPTURE_LOOK}
      doneText={{ title: t.quote.doneTitle, body: t.quote.doneBody }}
    />
  );
}
