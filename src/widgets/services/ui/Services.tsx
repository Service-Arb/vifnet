import { Eyebrow, Section } from "@evinvest/kitstart/react";
import type { Copy } from "@/entities/content";
import { SUBJECTS } from "@/shared/config/lead";
import { TYPE } from "@/shared/ui";
import { ServiceCard } from "./ServiceCard";

/**
 * One card per confirmed service: a real job photo, the name, one line, "on
 * quote" where the frame prints a price (there is no price list yet), and a
 * link that opens the form with the service picked. No checklists — the
 * methods they would list are not confirmed.
 */
export function Services({ copy, id, quote }: { copy: Copy; id: string; quote: { href: string; form: string } }) {
  const t = copy.t.services;
  return (
    <Section surface="card" id={id}>
      <Eyebrow className={TYPE.eyebrow}>{t.eyebrow}</Eyebrow>
      <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-10">
        <h2 className={TYPE.h2}>{t.title}</h2>
        <p className="text-sm leading-5 text-ink-soft md:w-80 md:shrink-0">{t.lede}</p>
      </div>
      <ul className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {SUBJECTS.map(subject => (
          <ServiceCard key={subject} subject={subject} item={t.items[subject]} words={{ onQuote: t.onQuote, ask: t.ask }} quote={quote} />
        ))}
      </ul>
    </Section>
  );
}
