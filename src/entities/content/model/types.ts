import type { CopySlice, CoreText, Said as CoreSaid } from "@evinvest/kitstart";
import type { Locale } from "@/shared/config/i18n";
import type { Bedrooms, Subject } from "@/shared/config/lead";
import type { NavId } from "@/shared/config/nav";
import type { PageKey, Subpage } from "@/shared/config/site";

/**
 * The facts a sentence may quote. Prose that names the phone or the place
 * takes them as an argument, so the number in the sentence and the number on
 * the card are one field.
 */
export interface Facts {
  place: string;
  /** `null` until the card has a phone. */
  phone: string | null;
}

export type Said = CoreSaid<Facts>;

/** The reviews of the frame, by reviewer; the page sets them in three columns. */
export const REVIEWS = ["amanda", "jordan", "marcus", "keisha", "priya", "carl"] as const;
export type ReviewKey = (typeof REVIEWS)[number];

export interface Review {
  name: string;
  city: string;
  /** "Verified · Aug 2025". */
  verified: string;
  quote: string;
  /** The captions of the two photos, on the cards the frame draws with photos. */
  photos?: { result: string; job: string };
}

/** A sub-page's head (Figma PageHead 37:1452): the eyebrow, the `<h1>` and the lede. */
export interface PageHeadCopy {
  eyebrow: string;
  title: string;
  lede: string;
}

/** A band's head: the eyebrow, the headline and, beside it from `md`, the lede. */
export interface BandHeadCopy {
  eyebrow: string;
  title: string;
  lede?: string;
}

export interface ServiceItem {
  name: string;
  tagline: string;
  points: readonly string[];
  /**
   * The card's price line when the page has no number for the job: a quote,
   * or a price list that does not price it. No figure: a number is only ever
   * the price list's (`services.fromPrice`).
   */
  price: string;
}

/**
 * Every string that differs between languages. It extends `CoreText`, the
 * words the machinery prints; the rest is the Figma frame's bands, one key per
 * band, EN verbatim from the frame. `FR` and `EN` are checked with
 * `satisfies Text`, so a key in one and not the other is a compile error.
 */
export interface Text extends CoreText<PageKey, Facts> {
  nav: Record<NavId, string> & { menu: string; book: string; home: string };
  /** The frame's rating: `value` "4.9", `count` "(340)" in the header. */
  rating: { value: string; count: string };
  hero: {
    /** Three lines; the second is a lead-in and the accent word. */
    title: { first: string; second: string; accent: string; third: string };
    lede: string;
    reviews: string;
    chips: readonly string[];
  };
  /** The brand's words over kitstart's `LeadCapture`; the rest of the card is the kit's. */
  quote: {
    /** The fields' names: visually hidden, still each field's accessible name. */
    labels: { name: string; mobile: string; locality: string; bedrooms: string; subject: string };
    /** What the frame draws in the empty fields instead of a label. */
    placeholders: { name: string; mobile: string; locality: string };
    /** Shown in the bedrooms select until one is picked. */
    bedroomsPlaceholder: string;
    trust: readonly string[];
    bedrooms: Record<Bedrooms, string>;
    /** The card once a lead is taken (Figma QuoteCard Done); `{first}`: the name's first word. */
    doneTitle: string;
    /** The same with no name given. */
    doneTitleNoName: string;
    /** Around the number as typed, which is set bold. */
    doneBody: readonly [string, string];
  };
  stats: readonly { value: string; label: string }[];
  services: {
    eyebrow: string;
    title: string;
    lede: string;
    badge: string;
    note: string;
    noteLink: string;
    items: Record<Subject, ServiceItem>;
    /** A priced job's line: where the price list's price starts, formatted in the page's language. */
    fromPrice: (amount: string) => string;
  };
  reviews: { eyebrow: string; title: string; google: string; average: string; total: string; cta: string; items: Record<ReviewKey, Review> };
  guarantee: { title: string; body: string };
  faqEyebrow: string;
  faqTitle: string;
  faqs: readonly { q: string; a: string }[];
  faqMore: string;
  closing: { title: string; lede: string; cta: string };
  footer: { copyright: (year: number) => string; privacy: string; terms: string };
  /** The sub-pages' heads, EN verbatim from their frames. */
  heads: Record<Subpage, PageHeadCopy>;
  /** Prices (41:1627): the table of the four services (PriceRow 38:1460). */
  priceTable: BandHeadCopy & {
    /** Visually hidden, as the frame asks. */
    caption: string;
    columns: { service: string; included: string; price: string };
    /**
     * The price under the column's "From": `label` above `amount`, as a row
     * draws it — for a job the page has no number for. A priced job's row is
     * `from` above the price list's starting price.
     */
    rows: Record<Subject, { label: string; amount: string }>;
    from: string;
    note: string;
  };
  /** Guarantee (40:1428): four worries and the term that answers each (PromiseCard 38:1463). */
  promises: BandHeadCopy & { items: readonly { worry: string; title: string; body: string }[] };
  /** Guarantee: the three steps (Step 38:1470). */
  steps: BandHeadCopy & { items: readonly { title: string; body: string }[] };
  /** About (42:1910): the crew (CrewCard 38:1476) — the frame's sample names. */
  team: BandHeadCopy & { facts: string; members: readonly { initials: string; name: string; role: string }[] };
  /** About: where the crew goes, and the map's face (MapFacade 38:1485). */
  area: BandHeadCopy & { towns: readonly string[]; map: { label: string; show: string; title: string } };
  sticky: { title: string; lede: string; call: string; book: string };
  /** The apex of a network of places: its `<head>` and the directory's link. */
  brandPage: { title: string; description: string; open: string };
}

export type Copy = CopySlice<Locale, Text, Facts>;
