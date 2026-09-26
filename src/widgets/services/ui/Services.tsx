import { Section } from "@evinvest/kitstart/react";
import type { Copy } from "@/entities/content";
import { SUBJECTS } from "@/shared/config/lead";
import { TYPE } from "@/shared/ui";
import { ServiceCard } from "./ServiceCard";

/**
 * The frame's services band (12:181 / 14:592) on cream: the heading and its
 * lede, the four cards (one column, two from `sm`, four from `lg`) and the
 * note under them, whose link opens the form.
 */
export function Services({ copy, id, quote }: { copy: Copy; id: string; quote: { href: string; form: string } }) {
  const t = copy.t.services;
  return (
    <Section surface="card" id={id} data-band="services" className="py-20">
      <p className={`${TYPE.eyebrow} text-positive`}>{t.eyebrow}</p>
      <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h2 className={`${TYPE.h2} text-brand`}>{t.title}</h2>
        <p className="w-80 max-w-full text-sm leading-5 text-ink-soft md:shrink-0">{t.lede}</p>
      </div>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SUBJECTS.map(subject => (
          <ServiceCard key={subject} subject={subject} item={t.items[subject]} badge={t.badge} quote={quote} />
        ))}
      </ul>
      <p className="mt-6 text-center text-xs leading-4 text-slate-400">
        {t.note}
        <a href={quote.href} data-intent="form_open" className="text-positive underline hover:no-underline">
          {t.noteLink}
        </a>
      </p>
    </Section>
  );
}
