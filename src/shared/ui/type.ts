/**
 * The Figma type scale (file 1wXlPmnmOdKYPDWz6N5EB8), phone first then from
 * `md` up: Fraunces Bold for the display styles, Instrument Sans for the rest.
 * No colour here — a band's scope gives the ink (and the gold band its
 * `on-primary`), so one style reads on every surface; a class string is not
 * merged, so a colour here and one at the call site would fight by source
 * order.
 */
export const TYPE = {
  /** Display/H1 — the hero headline: 48 → 72. */
  h1: "font-display font-bold text-5xl leading-[1.02] tracking-[-0.02em] md:text-7xl",
  /** Display/4xl → 5xl — a band's headline: 36 → 48. */
  h2: "font-display font-bold text-4xl leading-10 tracking-[-0.015em] md:text-5xl md:leading-none",
  /** Display/3xl → 4xl — the FAQ and the gold band: 30 → 36. */
  h2Band: "font-display font-bold text-3xl leading-9 tracking-[-0.01em] md:text-4xl md:leading-10",
  /** Display/2xl — the quote card's title: 24. */
  cardTitle: "font-display font-bold text-2xl leading-8",
  /** Display/3xl — a step's number, set like the frame's stats: 30. */
  stepNumber: "font-display font-bold text-3xl leading-9",
  /** Label/xs Eyebrow — over a band's headline (on the kit's `Eyebrow`): 12, caps. */
  eyebrow: "text-xs leading-4 font-bold uppercase tracking-[0.15em] md:text-xs md:tracking-[0.15em]",
  /** Body/lg relaxed — a band's lede: 16 → 18. */
  lede: "text-base leading-relaxed md:text-lg md:leading-relaxed",
  /** Body/sm relaxed — card and step text, answers: 14. */
  body: "text-sm leading-relaxed",
  /** Label/base Bold — a card's or a step's title: 16. */
  itemTitle: "text-base leading-6 font-bold",
  /** Label/sm Semibold — field labels, FAQ questions: 14. */
  label: "text-sm leading-5 font-semibold",
  /** Body/xs — hints, legal lines, table heads: 12. */
  fine: "text-xs leading-4",
} as const;
