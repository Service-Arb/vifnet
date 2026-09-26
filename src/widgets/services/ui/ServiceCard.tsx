import { SubjectLink } from "@/features/pick-subject";
import type { Subject } from "@/shared/config/lead";
import type { PhotoStem } from "@/shared/portfolio";
import { Photo, TYPE } from "@/shared/ui";

/** A real job photo per service, not an icon tile. */
const PHOTO: Record<Subject, PhotoStem> = {
  deep: "svc-deep",
  upholstery: "svc-upholstery",
  exterior: "svc-exterior",
  other: "svc-other",
};

// The frame's featured card (forest, gold rim) goes to "something else": it is
// the card that is only a way to the form, so the loud one claims nothing —
// no "most popular" badge, which would be a fact.
const FEATURED: Subject = "other";

// Lift on hover only where motion is welcome; the photo zooms inside its frame.
const CARD = "group relative flex flex-col overflow-hidden rounded-xl bg-background hover:shadow-elevated motion-safe:transition motion-safe:duration-200 motion-safe:hover:-translate-y-1";

export interface ServiceCardProps {
  subject: Subject;
  item: { name: string; body: string; photoAlt: string };
  words: { onQuote: string; ask: string };
  quote: { href: string; form: string };
}

/** The whole card is the link: the ask stretches its hit area over the card. */
export function ServiceCard({ subject, item, words, quote }: ServiceCardProps) {
  const featured = subject === FEATURED;
  return (
    <li className={`${CARD} ${featured ? "dark border-2 border-primary" : "border border-border"}`}>
      <div className="h-44 overflow-hidden">
        <Photo
          stem={PHOTO[subject]}
          alt={item.photoAlt}
          sizes="(width < 48rem) calc(100vw - 2rem), (width < 64rem) 50vw, 272px"
          className="size-full object-cover motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-105"
        />
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className={`${TYPE.itemTitle} text-ink`}>{item.name}</h3>
        <p className="text-sm leading-5 text-ink-soft">{item.body}</p>
        <p className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-3 text-sm">
          <span className="font-bold text-primary-ink">{words.onQuote}</span>
          <SubjectLink
            href={quote.href}
            form={quote.form}
            subject={subject}
            className="rounded-sm font-medium text-ink-mid group-hover:text-ink after:absolute after:inset-0 after:rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {words.ask}
          </SubjectLink>
        </p>
      </div>
    </li>
  );
}
