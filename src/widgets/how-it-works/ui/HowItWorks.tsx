import { Section } from "@evinvest/kitstart/react";
import type { Copy } from "@/entities/content";
import { TYPE } from "@/shared/ui";

/** Three steps, in order — the number is real sequence, so an `<ol>`. */
export function HowItWorks({ copy, id }: { copy: Copy; id: string }) {
  const t = copy.t.howItWorks;
  return (
    <Section id={id}>
      <h2 className={`${TYPE.h2} md:max-w-[720px]`}>{t.title}</h2>
      <ol className="mt-2 flex flex-col md:mt-12 md:flex-row md:gap-8">
        {t.steps.map((step, i) => (
          <li key={step.title} className="flex flex-1 flex-col gap-2.5 border-t border-border pt-6 pb-4 md:pb-0">
            <span className="text-[40px] font-semibold leading-none text-primary-ink">{i + 1}</span>
            <h3 className={`${TYPE.itemTitle} md:text-xl`}>{step.title}</h3>
            <p className={TYPE.itemBody}>{step.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
