import type { ServiceItem } from "@/entities/content";
import { SubjectLink } from "@/features/pick-subject";
import { FEATURED, type Subject } from "@/shared/config/lead";
import { Photo } from "@/shared/ui";

// Heights as drawn — 412 on a phone (410 with the 2 px rim), 428 in the desktop row —
// as floors, so a longer French line grows the card instead of clipping it.
const CARD =
  "group relative flex flex-col overflow-hidden rounded-2xl lg:min-h-[428px] hover:shadow-xl motion-safe:transition motion-safe:duration-200 motion-safe:hover:-translate-y-1";

export interface ServiceCardProps {
  subject: Subject;
  item: ServiceItem;
  badge: string;
  quote: { href: string; form: string };
}

/** The frame's ServiceCard (7:76). The whole card is the link: the name stretches its hit area over it. */
export function ServiceCard({ subject, item, badge, quote }: ServiceCardProps) {
  const featured = subject === FEATURED;
  return (
    <li className={`${CARD} ${featured ? "dark min-h-[410px] border-2 border-primary bg-background" : "min-h-[412px] border border-border bg-background"}`}>
      <div className="relative h-44 shrink-0 overflow-hidden bg-slate-100">
        <Photo
          stem={`service-${subject}`}
          alt=""
          sizes="(width < 40rem) calc(100vw - 2rem), (width < 64rem) 50vw, 268px"
          className="size-full object-cover motion-safe:transition-transform motion-safe:duration-200 motion-safe:group-hover:scale-105"
        />
        {featured && (
          <span className="absolute top-3 left-3 rounded-full bg-primary px-2.5 py-1 text-[10px] leading-[15px] font-bold tracking-[1px] text-brand uppercase">
            {badge}
          </span>
        )}
      </div>
      {/* The rim takes the featured card's 4 px out of its bottom padding below `lg`, as the 410 px frame does. */}
      <div className={`flex flex-1 flex-col gap-3 p-5 ${featured ? "max-lg:pb-4" : ""}`}>
        <div className="flex flex-col gap-0.5">
          <h3 className="text-base leading-6 font-bold text-ink">
            <SubjectLink
              href={quote.href}
              form={quote.form}
              subject={subject}
              className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
            >
              {item.name}
            </SubjectLink>
          </h3>
          <p className={`text-xs leading-4 ${featured ? "text-white/50" : "text-slate-400"}`}>{item.tagline}</p>
        </div>
        {/* 4 px past the padding: the frame's longest line ends on the padding's
            edge, and a sub-pixel of text rasterising would wrap it. */}
        <ul className="-mr-1 flex flex-1 flex-col gap-1.5 pb-1 text-xs leading-4">
          {item.points.map(point => (
            <li key={point} className="flex gap-1.5">
              <span aria-hidden="true" className="text-primary">
                ✓
              </span>
              <span className={featured ? "text-white/75" : "text-ink-soft"}>{point}</span>
            </li>
          ))}
        </ul>
        <p className={`text-sm leading-5 font-bold ${featured ? "text-primary" : "text-positive"}`}>{item.price}</p>
      </div>
    </li>
  );
}
