/**
 * The before/after pairs the portfolio shows, in the picker's order. Each is
 * one composite photo in `assets/profile_images/before_after_*.png`, cut into
 * its two halves by `scripts/photos.ts` (the `<key>-before` / `<key>-after`
 * stems). The caption of each is copy (`beforeAfter.pairs`).
 */
export const PAIRS = ["sofa", "bathtub", "carpet", "driveway", "mattress", "recliner"] as const;
export type PairKey = (typeof PAIRS)[number];
