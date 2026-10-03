import { LEAD_CAPTURE_TEXT, type Place } from "@evinvest/kitstart";
import { LeadCapture, type LeadCaptureLayout } from "@evinvest/kitstart/react";
import type { Copy } from "@/entities/content";
import { BEDROOMS, EXTRAS, LEAD, SUBJECTS } from "@/shared/config/lead";
import { BedroomsField, TrustLine } from "./fields";
import { LEAD_CAPTURE_LOOK } from "./look";

export interface QuoteCardProps {
  copy: Copy;
  /** The anchor every CTA on the page points at (`#devis`). */
  id: string;
  place: Place<string>;
  /** `contactOf(site, place)`: a `null` number is a channel the card does not offer. */
  contact: { phone: string | null; whatsapp: string | null };
  renderedAt: number;
  /** Experiment `lead_layout`'s switch: the need on the same screen, or first. */
  layout: LeadCaptureLayout;
  /** The assignment the card's events and its post carry; none when no test runs. */
  experiment: { name: string; variant: string } | undefined;
}

/**
 * The frame's QuoteCard (6:83): white, rounded-2xl, p-7, shadow-2xl — a light
 * island in the dark hero — around kitstart's `LeadCapture`, the form every
 * Service-Arb brand shares so an experiment's results pool across them. The
 * heading is the frame's; the fields, channels and events are the kit's. A
 * service card names its service (`data-need`), so the card does not ask it
 * again. The form is `#quote` and posts `form_id=quote`, the kit's defaults;
 * the callback is `#quote-callback`.
 */
export function QuoteCard({ copy, id, place, contact, renderedAt, layout, experiment }: QuoteCardProps) {
  const { t, locale } = copy;
  const kit = LEAD_CAPTURE_TEXT[locale];
  const text = {
    ...kit,
    needLabel: t.quote.labels.subject,
    localityLabel: t.quote.labels.locality,
    phoneLabel: t.quote.labels.mobile,
    nameLabel: t.quote.labels.name,
    submit: t.quoteForm.submit,
    honeypotLabel: t.quoteForm.honeypotLabel,
  };
  return (
    <div id={id} data-band="quote-card" className="light rounded-2xl bg-background p-7 text-ink shadow-2xl">
      <LeadCapture
        place={place}
        contact={contact}
        locale={locale}
        renderedAt={renderedAt}
        wire={LEAD.wire}
        needs={SUBJECTS.map(s => ({ value: s, label: t.services.items[s].name }))}
        layout={layout}
        name={{ field: EXTRAS.name.name }}
        extras={
          <BedroomsField
            label={`${t.quote.labels.bedrooms} (${kit.optional})`}
            placeholder={t.quote.bedroomsPlaceholder}
            options={BEDROOMS.map(b => ({ value: b, label: t.quote.bedrooms[b] }))}
          />
        }
        experiment={experiment}
        text={text}
        head={
          <div className="flex flex-col gap-1">
            <h2 className="font-display text-2xl leading-8 font-bold text-brand">{t.quoteForm.title}</h2>
            <p className="text-sm leading-5 text-ink-soft">{t.quoteForm.lede}</p>
          </div>
        }
        trust={<TrustLine lines={t.quote.trust} />}
        classNames={LEAD_CAPTURE_LOOK}
      />
    </div>
  );
}
