import { Faq, Section } from "@evinvest/kitstart/react";
import type { Copy } from "@/entities/content";
import { TYPE } from "@/shared/ui";

/**
 * The kit's `<details>` list beside the band's heading. The frame draws bare
 * rows on hairlines, Inter 600 questions and ink-mid answers, not the kit's
 * boxed list — set through the widget's part classes.
 */
const BARE = {
  list: "rounded-none border-x-0 border-t-0 bg-transparent",
  summary: "items-center px-0 py-[22px] md:px-0 md:py-[22px]",
  question: "font-sans font-semibold leading-[1.4]",
  answer: "-mt-2.5 px-0 pb-[22px] leading-[1.6] text-ink-mid md:px-0 md:pb-[22px]",
} as const;

export function FaqBand({ copy, id }: { copy: Copy; id: string }) {
  const { t } = copy;
  if (t.faqs.length === 0) return null;
  return (
    <Section id={id}>
      <div className="flex flex-col gap-4 md:flex-row md:gap-20">
        <h2 className={`${TYPE.h2} md:w-[352px] md:shrink-0`}>{t.faqTitle}</h2>
        <Faq items={t.faqs} id={`${id}-list`} className="flex-1" classNames={BARE} />
      </div>
    </Section>
  );
}
