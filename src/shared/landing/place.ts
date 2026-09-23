/**
 * The place model of the Service-Arb landing vertical, cut to what Vifnet is:
 * a service-area business. LANDING-ARCHITECTURE.md §3.2 also has a storefront
 * presence (address, geo, storefront photo); that half belongs with the shared
 * `@evinvest/kitstart` and is deliberately absent here, so no address or
 * coordinate can be written into this repo's config at all.
 *
 * Brand-local for now; a candidate for `@evinvest/kitstart` (scope not settled).
 */

/** International form, `+` first: `tel:` and `wa.me` derive from it without guessing a country. */
export type E164 = `+${string}`;

export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface OpeningHours {
  days: readonly DayOfWeek[];
  /** `HH:MM`, local time. */
  opens: string;
  closes: string;
}

/** Mirrored from the Business Profile API, never baked; `fetchedAt` bounds how long it may show. */
export interface Rating {
  value: number;
  count: number;
  /** ISO 8601. */
  fetchedAt: string;
}

/**
 * Communes by name. §3.2's `radius` variant carries a centre coordinate, which
 * for a business without premises would publish where its owner lives; it is
 * left out on purpose.
 */
export interface ServiceArea {
  kind: "localities";
  names: readonly string[];
}

/** The crew goes to the customer: there is no address, and no field to hold one. */
export interface Presence {
  kind: "service-area";
}

export interface Place<L extends string> {
  slug: string;
  /** The Google Business Profile's own name — the schema.org `name`. */
  gbpName: string;
  name: Record<L, string>;
  presence: Presence;
  serviceArea: readonly ServiceArea[] | null;
  channels: { phone: E164 | null; whatsapp: E164 | null };
  hours: readonly OpeningHours[] | null;
  rating: Rating | null;
}
