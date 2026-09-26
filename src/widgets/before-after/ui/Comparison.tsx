"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
// The file, not the `shared/ui` barrel: the barrel carries the lock-up and
// every photo's URLs, which have no business in this island's bundle.
import { Picture, type PhotoSet } from "@/shared/ui/Picture";
import { TYPE } from "@/shared/ui/type";

export interface ComparisonPair {
  caption: string;
  before: PhotoSet;
  after: PhotoSet;
  thumb: PhotoSet;
}

export interface ComparisonProps {
  pairs: readonly ComparisonPair[];
  words: { before: string; after: string; slider: string; picker: string; position: string };
  /** The band's heading, rendered on the server. */
  head: ReactNode;
}

const VIEWER_SIZES = "(width < 48rem) calc(100vw - 2rem), 560px";
const TAG = `absolute bottom-3 rounded-full bg-background px-2.5 py-[5px] ${TYPE.fine} font-semibold text-ink md:bottom-4`;

const noop = () => () => {};

/** `false` in the server HTML and until hydration, `true` after: no effect, no flash. */
function useHydrated(): boolean {
  return useSyncExternalStore(noop, () => true, () => false);
}

/**
 * The compare slider and its pair picker. The slider is a native range input
 * stretched over the photo, transparent: keyboard arrows, touch and pointer
 * drag anywhere on the image come with it, and a screen reader hears "Avant
 * 50 %". The before photo lies over the after one, clipped at the handle.
 */
export function Comparison({ pairs, words, head }: ComparisonProps) {
  const [index, setIndex] = useState(0);
  const [position, setPosition] = useState(50);
  const hydrated = useHydrated();
  const pair = pairs[index] ?? pairs[0];
  if (!pair) return null;
  return (
    <div className="flex flex-col gap-7 md:grid md:grid-cols-[minmax(0,1fr)_560px] md:grid-rows-[auto_auto_auto_1fr] md:gap-x-20 md:gap-y-6">
      <div className="flex flex-col md:col-start-1 md:row-start-1">{head}</div>
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-muted md:col-start-2 md:row-span-4 md:row-start-1">
        <Picture set={pair.after} alt={`${pair.caption} — ${words.after}`} sizes={VIEWER_SIZES} className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
          <Picture set={pair.before} alt="" sizes={VIEWER_SIZES} className="absolute inset-0 size-full object-cover" />
        </div>
        <span aria-hidden="true" className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-background" style={{ left: `${position}%` }} />
        <span aria-hidden="true" className={`${TAG} left-3 md:left-4`}>
          {words.before}
        </span>
        <span aria-hidden="true" className={`${TAG} right-3 md:right-4`}>
          {words.after}
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={position}
          // Until the script runs, dragging would move nothing: the control
          // is off rather than dead.
          disabled={!hydrated}
          onChange={e => setPosition(Number(e.target.value))}
          aria-label={`${words.slider} — ${pair.caption}`}
          aria-valuetext={words.position.replace("{n}", String(position))}
          className="peer absolute inset-0 size-full cursor-ew-resize touch-pan-y opacity-0 disabled:cursor-default"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background text-ink shadow-overlay peer-focus-visible:ring-2 peer-focus-visible:ring-ring"
          style={{ left: `${position}%` }}
        >
          <Chevrons />
        </span>
      </div>
      <div role="group" aria-label={words.picker} className="-mx-1 flex gap-2.5 overflow-x-auto p-1 md:col-start-1 md:row-start-2 md:flex-wrap md:gap-3 md:overflow-visible">
        {pairs.map((p, i) => (
          <button
            key={p.caption}
            type="button"
            aria-pressed={i === index}
            aria-label={p.caption}
            onClick={() => {
              setIndex(i);
              setPosition(50);
            }}
            className={`relative size-14 shrink-0 overflow-hidden rounded-lg md:size-[72px] ${i === index ? "ring-[2.5px] ring-primary-ink" : "ring-1 ring-border"}`}
          >
            <Picture set={p.thumb} alt="" sizes="72px" className="size-full object-cover" />
          </button>
        ))}
      </div>
      <p aria-live="polite" className="text-sm font-medium text-ink-mid md:col-start-1 md:row-start-3">
        {pair.caption}
      </p>
    </div>
  );
}

function Chevrons() {
  return (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 5.5 3.5 10 8 14.5M12 5.5l4.5 4.5-4.5 4.5" />
    </svg>
  );
}
