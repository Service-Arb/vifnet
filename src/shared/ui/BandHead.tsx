import { TYPE } from "./type";

/**
 * A light band's head as the frame repeats it: the eyebrow, then the headline
 * with its lede beside it, bottom-aligned, from `md` (a 320 px column) and
 * under it on a phone.
 */
export function BandHead({ eyebrow, title, lede }: { eyebrow: string; title: string; lede?: string | undefined }) {
  return (
    <div className="flex flex-col gap-3">
      <p className={`${TYPE.eyebrow} text-positive`}>{eyebrow}</p>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h2 className={`${TYPE.h2} min-w-0 flex-1 text-brand`}>{title}</h2>
        {lede && <p className="text-sm leading-5 text-ink-soft md:w-80 md:shrink-0">{lede}</p>}
      </div>
    </div>
  );
}
