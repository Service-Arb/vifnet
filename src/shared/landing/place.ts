/**
 * The place model of the Service-Arb landing vertical.
 *
 * Brand-local for now; a candidate for the shared `@evinvest/kitstart`, whose
 * scope is not settled. Kept in the shape of LANDING-ARCHITECTURE.md §3.2 so a
 * move, if it happens, is an import-path change.
 */

/** International form, `+` first: `tel:` and `wa.me` derive from it without guessing a country. */
export type E164 = `+${string}`;

export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export interface PostalAddress {
  street: string;
  postalCode: string;
  locality: string;
  /** Région administrative, as schema.org `addressRegion`. */
  region: string;
  /** ISO 3166-1 alpha-2. */
  country: string;
}

export interface Geo {
  lat: number;
  lng: number;
}

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

export type ServiceArea =
  | { kind: "localities"; names: readonly string[] }
  | { kind: "radius"; center: { lat: number; lng: number }; km: number };

/**
 * A storefront has an address a customer can walk into; a service-area
 * business has none, and the type says so — there is no field a placeholder
 * address could be written into.
 */
export type Presence<L extends string> =
  | {
      kind: "storefront";
      address: PostalAddress;
      geo: Geo | null;
      storefrontPhoto: string | null;
      landmark: Record<L, string> | null;
    }
  | { kind: "service-area" };

export interface Place<L extends string> {
  slug: string;
  /** The Google Business Profile's own name — the schema.org `name`. */
  gbpName: string;
  name: Record<L, string>;
  presence: Presence<L>;
  serviceArea: readonly ServiceArea[] | null;
  channels: { phone: E164 | null; whatsapp: E164 | null };
  hours: readonly OpeningHours[] | null;
  rating: Rating | null;
}

/** A place as one request sees it: its language and how its links are written. */
export interface PlaceView<L extends string> {
  place: Place<L>;
  locale: L;
  mode: "host" | "path" | "single";
  href(suffix: string, locale?: L): string;
  url(suffix: string, locale?: L): string;
}
