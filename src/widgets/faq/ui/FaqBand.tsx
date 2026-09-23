import { Faq, Section } from "@evinvest/kitstart/react";
import type { Copy } from "@/entities/content";
import { TYPE } from "@/shared/ui";

/**
 * The kit's `<details>` list beside the band's heading. The frame draws bare
 * rows with hairlines, not the kit's boxed list, so the box is taken off here.
 */
const BARE =
  "[&>div]:rounded-none [&>div]:border-x-0 [&>div]:border-t-0 [&>div]:bg-transparent [&_summary]:px-0 [&_summary]:py-[22px] [&_details>p]:px-0 [&_details>p]:pb-[22px]";

export function FaqBand({ copy, id }: { copy: Copy; id: string }) {
  const { t } = copy;
  if (t.faqs.length === 0) return null;
  return (
    <Section id={id}>
      <div className="flex flex-col gap-4 md:flex-row md:gap-20">
        <h2 className={`${TYPE.h2} md:w-[352px] md:shrink-0`}>{t.faqTitle}</h2>
        <Faq items={t.faqs} id={`${id}-list`} className={`flex-1 ${BARE}`} />
      </div>
    </Section>
  );
}
