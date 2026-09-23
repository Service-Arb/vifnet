import type { Subject } from "./lead";

/** One line of the price list: a job and what it costs, TTC, in whole euros. */
export interface PriceRow {
  subject: Subject;
  eur: number;
}

/**
 * The published price list, or `null` while the owner has none (`OWNER_TODO`
 * PRICES). The price-table band renders only from real numbers: a table of
 * "à publier" rows would be a promise with nothing in it.
 */
export const PRICES: readonly PriceRow[] | null = null;
