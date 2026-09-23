import { Section } from "@evinvest/kitstart/react";
import type { Rating } from "@evinvest/kitstart";
import type { Copy } from "@/entities/content";
import { TYPE } from "@/shared/ui";

/**
 * The Google rating, mirrored live from the Business Profile — never
 * hand-written reviews (a curated wall of five stars reads as filtered). The
 * band is absent until the profile exists and has a rating; the rating is
 * never baked, so it comes and goes with the live source.
 */
export function Reviews({ copy, id, rating }: { copy: Copy; id: string; rating: Rating | null }) {
  if (rating === null || rating.count === 0) return null;
  const t = copy.t.reviews;
  const value = new Intl.NumberFormat(copy.locale, { maximumFractionDigits: 1 }).format(rating.value);
  return (
    <Section id={id} className="pt-0">
      <h2 className={`${TYPE.h2} md:max-w-[720px]`}>{t.title}</h2>
      <p className="mt-6 flex items-center gap-3 text-lg font-medium text-ink md:mt-12">
        <span aria-hidden="true" className="text-2xl text-accent-warn">
          ★
        </span>
        {t.summary(value, rating.count)}
      </p>
    </Section>
  );
}
