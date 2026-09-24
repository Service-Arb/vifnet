import { Section } from "@evinvest/kitstart/react";
import type { Copy } from "@/entities/content";
import { SubjectLink } from "@/features/pick-subject";
import type { PhotoStem } from "@/shared/portfolio";
import { LEAD, SUBJECTS, type Subject } from "@/shared/config/lead";
import { Photo, TYPE } from "@/shared/ui";

/** A real job photo per service, not an icon tile. */
const PHOTO: Record<Subject, PhotoStem> = {
  deep: "svc-deep",
  upholstery: "svc-upholstery",
  exterior: "svc-exterior",
  other: "svc-other",
};

/**
 * One row per confirmed service: photo, name, one line, "on quote" (no price
 * list yet) and a link that opens the form with the service picked. Rows,
 * not cards — no background, no border.
 */
export function Services({ copy, id, quote }: { copy: Copy; id: string; quote: { href: string; form: string } }) {
  const t = copy.t.services;
  return (
    <Section id={id}>
      <div className="flex flex-col gap-3 md:max-w-[720px] md:gap-4">
        <h2 className={TYPE.h2}>{t.title}</h2>
        <p className={`${TYPE.lede} md:max-w-[600px]`}>{t.lede}</p>
      </div>
      <ul className="mt-8 grid gap-7 md:mt-12 md:grid-cols-2 md:gap-x-8 md:gap-y-12">
        {SUBJECTS.map(subject => {
          const item = t.items[subject];
          return (
            <li key={subject} className="flex items-start gap-4 md:gap-6">
              <Photo stem={PHOTO[subject]} alt={item.photoAlt} sizes="(width < 48rem) 96px, 168px" className="size-24 shrink-0 rounded-lg object-cover md:size-[168px]" />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5 md:gap-2.5">
                <h3 className={TYPE.itemTitle}>{item.name}</h3>
                <p className={TYPE.itemBody}>{item.body}</p>
                <p className="flex flex-wrap items-center gap-3 pt-1 text-sm">
                  <span className="text-ink-soft">{t.onQuote}</span>
                  <SubjectLink href={quote.href} form={quote.form} field={LEAD.wire.subject} subject={subject} className="font-medium text-primary-ink hover:underline">
                    {t.ask}
                  </SubjectLink>
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
