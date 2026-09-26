import { Button, Section } from "@evinvest/kitstart/react";
import { telHref } from "@evinvest/marketing";
import type { Copy } from "@/entities/content";
import { TYPE } from "@/shared/ui";

export interface ClosingProps {
  copy: Copy;
  id: string;
  /** Where the quote form is: the hero's card. */
  quoteHref: string;
  /** The brand's phone, or `null` — then the band has one button. */
  phone: string | null;
}

/**
 * The last ask, on gold: the headline and a button back up to the form. The
 * lede keeps the full `on-primary` ink — the frame's faded forest on gold
 * would not reach AA. A call button joins only once the brand has a phone.
 */
export function Closing({ copy, id, quoteHref, phone }: ClosingProps) {
  const { t, f } = copy;
  return (
    <Section id={id} surface="primary" tight>
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <h2 className={TYPE.h2Band}>{t.closing.title}</h2>
        <p className="mt-3 text-base leading-6">{t.closing.lede}</p>
        <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <Button href={quoteHref} variant="secondary" size="xl" data-intent="form_open" className="font-bold">
            {t.header.cta}
            <span aria-hidden="true">→</span>
          </Button>
          {phone && (
            <Button href={telHref(phone)} variant="outline" size="xl" aria-label={t.callLabel(f)} className="border-ink/15 bg-background/30 font-bold text-on-primary hover:bg-background/50 hover:text-on-primary">
              {phone}
            </Button>
          )}
        </div>
      </div>
    </Section>
  );
}
