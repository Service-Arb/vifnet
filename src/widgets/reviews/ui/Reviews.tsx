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
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" className="shrink-0 fill-accent-warn">
          <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
        </svg>
        {t.summary(value, rating.count)}
      </p>
    </Section>
  );
}
