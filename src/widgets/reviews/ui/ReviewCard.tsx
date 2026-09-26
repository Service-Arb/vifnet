import type { Review, ReviewKey } from "@/entities/content";
import { Icon, Photo, Stars } from "@/shared/ui";

/** The reviews the frame draws with photos: the result, then the job. */
type WithPhotos = Extract<ReviewKey, "amanda" | "marcus" | "priya">;
const hasPhotos = (key: ReviewKey): key is WithPhotos => key === "amanda" || key === "marcus" || key === "priya";

/** The frame's ReviewCard (7:137), with its two photos where the frame has them. */
export function ReviewCard({ id, review }: { id: ReviewKey; review: Review }) {
  const media = hasPhotos(id) && review.photos ? { stem: id, ...review.photos } : null;
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-background">
      {media && (
        <div className="relative h-[202.5px] overflow-hidden bg-slate-100">
          <Photo stem={`review-${media.stem}-result`} alt="" sizes="(width < 48rem) calc(100vw - 2rem), 360px" className="size-full object-cover" />
          <p className="absolute right-[-2px] bottom-0 left-0 bg-linear-to-t from-black/55 to-black/0 px-4 py-3 text-xs leading-[16.5px] text-white">
            {media.result}
          </p>
        </div>
      )}
      <div className="flex flex-col gap-3 p-5">
        <div className="flex flex-col gap-2.5">
          <Stars />
          <blockquote className="text-sm leading-[22.75px] text-ink-mid">{review.quote}</blockquote>
        </div>
        {media && (
          <div className="relative h-32 overflow-hidden rounded-xl bg-slate-100">
            <Photo stem={`review-${media.stem}-job`} alt="" sizes="(width < 48rem) calc(100vw - 4.5rem), 320px" className="absolute top-0 left-0 h-auto w-full" />
            <p className="absolute right-[-2px] bottom-0 left-0 bg-black/50 px-3 py-1.5 text-[10px] leading-[15px] text-white">{media.job}</p>
          </div>
        )}
        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <p className="flex flex-col">
            <span className="text-sm leading-5 font-semibold text-brand">{review.name}</span>
            <span className="text-xs leading-4 text-slate-400">{review.city}</span>
          </p>
          <p className="flex items-center gap-1 text-[10px] leading-[15px] whitespace-nowrap text-slate-400">
            <Icon name="google-g" className="size-[9px]" />
            {review.verified}
          </p>
        </div>
      </div>
    </article>
  );
}
