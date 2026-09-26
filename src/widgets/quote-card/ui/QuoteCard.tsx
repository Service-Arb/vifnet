import { TYPE } from "@/shared/ui";
import { QuoteForm, type QuoteFormProps } from "./QuoteForm";

/**
 * The form on a white card — a light island in the dark hero, the anchor
 * every CTA on the page points at (`id`, `#devis`).
 */
export function QuoteCard({ id, ...form }: QuoteFormProps & { id: string }) {
  const t = form.copy.t.quoteForm;
  return (
    <div id={id} className="light rounded-xl bg-background p-5 text-ink shadow-overlay md:p-7">
      <h2 className={TYPE.cardTitle}>{t.title}</h2>
      <p className="mt-1 text-sm text-ink-soft">{t.lede}</p>
      <div className="mt-5">
        <QuoteForm {...form} />
      </div>
    </div>
  );
}
