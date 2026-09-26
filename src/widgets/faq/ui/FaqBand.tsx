import { Eyebrow, Faq, Section } from "@evinvest/kitstart/react";
import type { Copy } from "@/entities/content";
import { TYPE } from "@/shared/ui";

/**
 * The kit's `<details>` list, restyled through its part classes into the
 * frame's separate cards: 14 px questions, a chevron that turns over when an
 * item opens, the answer under a hairline. The kit draws its icon as a "+";
 * `vifnet-chevron` (app/globals.css) masks it into the chevron.
 */
const CARDS = {
  list: "flex flex-col gap-2 overflow-visible rounded-none border-0 bg-transparent",
  item: "overflow-hidden rounded-xl border border-border bg-background last:border-b",
  summary: "items-center px-6 py-4 hover:bg-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring md:px-6 md:py-4",
  question: "font-sans text-sm leading-5 font-semibold text-ink",
  icon: "vifnet-chevron text-ink-soft motion-safe:transition-transform group-open:rotate-180",
  answer: `border-t border-border px-6 pt-3 pb-4 md:px-6 md:pb-4 ${TYPE.body} text-ink-soft`,
} as const;

export function FaqBand({ copy, id }: { copy: Copy; id: string }) {
  const { t } = copy;
  if (t.faqs.length === 0) return null;
  return (
    <Section surface="card" id={id}>
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-col items-center text-center">
          <Eyebrow className={TYPE.eyebrow}>{t.faqEyebrow}</Eyebrow>
          <h2 className={`${TYPE.h2Band} mt-3`}>{t.faqTitle}</h2>
        </div>
        <Faq items={t.faqs} id={`${id}-list`} className="mt-10" classNames={CARDS} />
      </div>
    </Section>
  );
}
