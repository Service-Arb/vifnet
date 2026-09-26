import type { Rating } from "@evinvest/kitstart";
import type { Copy } from "@/entities/content";

const STAR = "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z";

/** The live Google rating under the lede: five gold stars, the value, and the summary line. No faces — there are no customer photos. */
export function HeroRating({ rating, copy }: { rating: Rating; copy: Copy }) {
  const value = new Intl.NumberFormat(copy.locale, { maximumFractionDigits: 1 }).format(rating.value);
  return (
    <div className="mt-7 flex flex-col gap-0.5">
      <p className="flex items-center gap-2">
        <span className="flex gap-0.5" aria-hidden="true">
          {[0, 1, 2, 3, 4].map(i => (
            <svg key={i} viewBox="0 0 24 24" width="14" height="14" className="fill-accent-warn">
              <path d={STAR} />
            </svg>
          ))}
        </span>
        <span className="text-sm font-bold text-ink" aria-hidden="true">{value}</span>
      </p>
      <p className="text-xs text-ink-soft">{copy.t.reviews.summary(value, rating.count)}</p>
    </div>
  );
}
