import { Eyebrow, Section } from "@evinvest/kitstart/react";
import type { Copy } from "@/entities/content";
import { TYPE } from "@/shared/ui";

/**
 * Three steps, in order — the number is real sequence, so an `<ol>`. Set in
 * the frame's forest band (its stats and guarantee, neither of which there is
 * a fact for): gold numerals over hairlines.
 */
export function HowItWorks({ copy, id }: { copy: Copy; id: string }) {
  const t = copy.t.howItWorks;
  return (
    <Section id={id} polarity="dark" surface="card">
      <Eyebrow className={TYPE.eyebrow}>{t.eyebrow}</Eyebrow>
      <h2 className={`${TYPE.h2} mt-3 md:max-w-[720px]`}>{t.title}</h2>
      <ol className="mt-10 grid gap-6 md:mt-12 md:grid-cols-3 md:gap-8">
        {t.steps.map((step, i) => (
          <li key={step.title} className="flex flex-col gap-2 border-t border-border pt-6">
            <span className={`${TYPE.stepNumber} text-primary-ink`}>{i + 1}</span>
            <h3 className={`${TYPE.itemTitle} mt-1 text-ink`}>{step.title}</h3>
            <p className={`${TYPE.body} text-ink-mid`}>{step.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
