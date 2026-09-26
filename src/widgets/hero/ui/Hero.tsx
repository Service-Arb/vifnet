import type { Rating } from "@evinvest/kitstart";
import { Section } from "@evinvest/kitstart/react";
import type { ReactNode } from "react";
import type { Copy } from "@/entities/content";
import { SubjectLink } from "@/features/pick-subject";
import type { Subject } from "@/shared/config/lead";
import { Photo, TYPE } from "@/shared/ui";
import { HeroRating } from "./HeroRating";

/** The confirmed jobs, as chips that open the form with the job picked — in place of the frame's trust claims. */
const CHIPS: readonly Subject[] = ["deep", "upholstery", "exterior"];

// A tap target of 44 px around a 28 px chip, by a centred pseudo-element; the
// rows' gap on a phone keeps two targets from overlapping.
const CHIP =
  "relative rounded-full border border-ink/10 bg-ink/8 px-3 py-1.5 text-xs text-ink-mid hover:bg-ink/15 after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

export interface HeroProps {
  copy: Copy;
  workHref: string;
  /** Where the form is, and its id: the chips pick a job in it. */
  quote: { href: string; form: string };
  /** The live Google rating, or `null` — then no social proof at all. */
  rating: Rating | null;
  /** The quote card, beside the copy from a laptop up and under it below. */
  form: ReactNode;
}

/**
 * The promise and the form, on the dark forest over a job photo faded behind
 * a gradient — the gradient keeps the text at its contrast over any photo.
 * Nothing here states a fact the owner has not given: no counts, no
 * guarantees; the rating only when the live profile has one.
 */
export function Hero({ copy, workHref, quote, rating, form }: HeroProps) {
  const { hero, subjects } = copy.t;
  const [lead, accent, tail] = hero.title;
  return (
    <Section polarity="dark" className="relative isolate overflow-hidden pt-12 pb-16 md:py-24">
      <Photo stem="hero" alt="" sizes="100vw" priority className="absolute inset-0 -z-10 size-full object-cover opacity-20" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-background/85 lg:bg-transparent lg:bg-linear-to-r lg:from-background lg:via-background/85 lg:to-transparent" />
      <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-12 xl:gap-20">
        <div className="flex min-w-0 flex-1 flex-col items-start">
          <h1 className={`${TYPE.h1} text-ink`}>
            {lead}
            <span className="text-positive">{accent}</span>
            {tail}
          </h1>
          <p className={`${TYPE.lede} mt-5 max-w-md text-ink-mid`}>{hero.lede}</p>
          {rating && <HeroRating rating={rating} copy={copy} />}
          <ul className="mt-7 flex flex-wrap gap-x-2 gap-y-4 md:gap-y-2">
            {CHIPS.map(subject => (
              <li key={subject}>
                <SubjectLink href={quote.href} form={quote.form} subject={subject} className={CHIP}>
                  {subjects[subject]}
                </SubjectLink>
              </li>
            ))}
          </ul>
          <a href={workHref} className="mt-6 rounded-sm text-sm font-medium text-primary-ink hover:underline">
            {hero.toWork}
          </a>
        </div>
        <div className="lg:w-[440px] lg:shrink-0 xl:w-[520px]">{form}</div>
      </div>
    </Section>
  );
}
