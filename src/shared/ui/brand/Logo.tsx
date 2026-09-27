import { HOUSE, STAR, SWOOSH, TAGLINE, WINDOW, WORD } from "./paths";

/**
 * Figma Logo 5:66, per size: the mark's height, the gap after it, the word's
 * and the tagline's font size / line height, the gap between them, and the
 * word's box width. sm is its own layout, not md scaled: its word is larger
 * against the mark (18 on a 24 mark, against 30 on 42).
 */
const SIZE = {
  md: { mark: 42, gap: 14, word: [30, 30], wordWidth: 96, tagline: [7.4, 10], taglineGap: 2 },
  sm: { mark: 24, gap: 8, word: [18, 22], wordWidth: 58, tagline: [4.2, 6], taglineGap: 1 },
} as const;

/** The frame the paths are drawn in (`./paths`): md's mark, and where its word and tagline sit. */
const MD = { mark: [65.333, 42], x: 79.333, wordBaseline: 26, wordSize: 30, taglineBaseline: 40, taglineSize: 7.4 } as const;
/** Baseline below the middle of the line box, in em, as the outlines sit in md. */
const WORD_DROP = 11 / 30;
const TAGLINE_DROP = 3 / 7.4;

export type LogoSize = keyof typeof SIZE;
export type LogoTone = "dark" | "light";

const n = (v: number) => +v.toFixed(3);

function layout(size: LogoSize, tagline: boolean) {
  const s = SIZE[size];
  const [wordSize, wordLine] = s.word;
  const [tagSize, tagLine] = s.tagline;
  const scale = s.mark / MD.mark[1];
  const markWidth = MD.mark[0] * scale;
  const column = wordLine + (tagline ? s.taglineGap + tagLine : 0);
  const height = Math.max(s.mark, column);
  const top = (height - column) / 2;
  const x = markWidth + s.gap;
  const place = (y: number, size: number, baseline: number, from: number) =>
    `translate(${n(x)} ${n(y)}) scale(${n(size / from)}) translate(${-MD.x} ${-baseline})`;
  return {
    width: n(x + s.wordWidth),
    height,
    mark: `translate(0 ${n((height - s.mark) / 2)}) scale(${n(scale)})`,
    word: place(top + wordLine / 2 + wordSize * WORD_DROP, wordSize, MD.wordBaseline, MD.wordSize),
    tagline: place(top + wordLine + s.taglineGap + tagLine / 2 + tagSize * TAGLINE_DROP, tagSize, MD.taglineBaseline, MD.taglineSize),
  };
}

export interface LogoProps {
  size?: LogoSize;
  /** `dark` sits on forest (the header, the footer), `light` on a light surface. */
  tone?: LogoTone;
  /** "MÉNAGE À DOMICILE" under the word; the frame drops it at sm, where it would set below 8 px. */
  tagline?: boolean;
  className?: string;
}

/**
 * The Vifnet lock-up (Figma Logo 5:66): the mark, the word and the tagline,
 * inline so each part paints through a class bound to a token
 * (`app/globals.css`) — the gold star stays gold in either tone.
 */
export function Logo({ size = "md", tone = "dark", tagline = size === "md", className }: LogoProps) {
  const l = layout(size, tagline);
  return (
    <svg
      viewBox={`0 0 ${l.width} ${l.height}`}
      width={l.width}
      height={l.height}
      role="img"
      aria-label="Vifnet"
      data-tone={tone}
      className={`vifnet-lockup block shrink-0 ${className ?? ""}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform={l.mark}>
        <path className="vifnet-mark-house" d={HOUSE} />
        <path className="vifnet-mark-house" d={WINDOW} />
        <path className="vifnet-mark-swoosh" d={SWOOSH} />
        <path className="vifnet-mark-star" d={STAR} />
      </g>
      <path className="vifnet-lockup-word" transform={l.word} d={WORD} />
      {tagline && <path className="vifnet-lockup-tagline" transform={l.tagline} d={TAGLINE} />}
    </svg>
  );
}
