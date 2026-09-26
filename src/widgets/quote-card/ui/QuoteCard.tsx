import type { Copy } from "@/entities/content";
import { BEDROOMS, SUBJECTS } from "@/shared/config/lead";
import { QuoteForm } from "./QuoteForm";

export interface QuoteCardProps {
  copy: Copy;
  /** The anchor every CTA on the page points at (`#devis`). */
  id: string;
  placeSlug: string;
  renderedAt: number;
  /** The `<form>`'s id — what the service links pick a subject in. */
  formId: string;
}

/**
 * The frame's QuoteCard (6:83): white, rounded-2xl, p-7, shadow-2xl — a light
 * island in the dark hero. The header is the server's; the steps are the
 * client island's, given only the strings they print.
 */
export function QuoteCard({ copy, id, placeSlug, renderedAt, formId }: QuoteCardProps) {
  const { t, locale } = copy;
  return (
    <div id={id} data-band="quote-card" className="light flex flex-col gap-5 rounded-2xl bg-background p-7 text-ink shadow-2xl">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-2xl leading-8 font-bold text-brand">{t.quoteForm.title}</h2>
        <p className="text-sm leading-5 text-ink-soft">{t.quoteForm.lede}</p>
      </div>
      <QuoteForm
        formId={formId}
        placeSlug={placeSlug}
        locale={locale}
        renderedAt={renderedAt}
        words={{ ...t.quote, submit: t.quoteForm.submit, honeypot: t.quoteForm.honeypotLabel }}
        bedrooms={BEDROOMS.map(b => ({ value: b, label: t.quote.bedrooms[b] }))}
        subjects={SUBJECTS.map(s => ({ value: s, label: t.services.items[s].name }))}
      />
    </div>
  );
}
