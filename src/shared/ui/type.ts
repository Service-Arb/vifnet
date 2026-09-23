/**
 * The Figma type scale (Inter), phone first then from `md` up. The kit's
 * `Display` is a bold serif-display scale; Vifnet's headings are Inter 600
 * at the sizes the frames set, so the bands spell them from here — one place
 * to retune.
 */
export const TYPE = {
  /** Hero headline: 38 → 64. */
  h1: "font-semibold text-ink text-[38px] leading-[1.04] tracking-[-0.03em] md:text-[64px] md:leading-[1.02] md:tracking-[-0.035em]",
  /** Band headline: 30 → 40. */
  h2: "font-semibold text-ink text-[30px] leading-[1.12] tracking-[-0.02em] md:text-[40px] md:leading-[1.1] md:tracking-[-0.025em]",
  /** The closing band's headline: 30 → 48. */
  h2Closing: "font-semibold text-ink text-[30px] leading-[1.12] tracking-[-0.02em] md:text-[48px] md:leading-[1.05] md:tracking-[-0.03em]",
  /** A band's lede: 17 → 18. */
  lede: "text-ink-mid text-[17px] leading-[1.58] md:text-lg md:leading-[1.6]",
  /** A row's title (service, step): 18 → 21. */
  itemTitle: "font-semibold text-ink text-lg leading-[1.3] tracking-[-0.01em] md:text-[21px]",
  /** A row's body: 15 → 16. */
  itemBody: "text-ink-mid text-[15px] leading-[1.55] md:text-base",
} as const;
