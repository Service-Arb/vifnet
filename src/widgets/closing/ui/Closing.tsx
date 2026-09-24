import { Section } from "@evinvest/kitstart/react";
import { Photo, TYPE } from "@/shared/ui";
import { QuoteForm, type QuoteFormProps } from "./QuoteForm";

/**
 * The band every CTA points at (`#devis`): dark, as the frame draws it, the
 * headline and a job photo beside the form — the photo only from a tablet
 * up, where there is room beside the form.
 */
export function Closing({ id, ...form }: QuoteFormProps & { id: string }) {
  const t = form.copy.t.closing;
  return (
    <Section id={id} polarity="dark" className="scroll-mt-4">
      <div className="flex flex-col gap-5 md:flex-row md:gap-20">
        <div className="flex flex-1 flex-col gap-5 md:gap-6">
          <h2 className={`${TYPE.h2Closing} md:max-w-[520px]`}>{t.title}</h2>
          <p className={`${TYPE.lede} md:max-w-[480px]`}>{t.lede}</p>
          <div className="hidden md:block">
            <Photo stem="closing" alt={t.photoAlt} sizes="520px" className="h-[340px] w-[520px] rounded-lg object-cover" />
          </div>
        </div>
        <div className="md:w-[520px] md:shrink-0">
          <QuoteForm {...form} />
        </div>
      </div>
    </Section>
  );
}
