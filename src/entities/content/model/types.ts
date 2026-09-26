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
  quote: {
    placeholders: { name: string; mobile: string; locality: string };
    /** Visually hidden: the frame draws placeholders only. */
    labels: { name: string; mobile: string; locality: string; bedrooms: string; subject: string };
    next: string;
    almost: string;
    trust: readonly string[];
    bedrooms: Record<Bedrooms, string>;
    /** `{first}`: the first word of the name. */
    doneTitle: string;
    /** Around the phone as typed, which is set bold. */
    doneBody: readonly [string, string];
  };
  stats: readonly { value: string; label: string }[];
  services: { eyebrow: string; title: string; lede: string; badge: string; note: string; noteLink: string; items: Record<Subject, ServiceItem> };
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
    /** The price under the column's "From": `label` above `amount`, as a row draws it. */
    rows: Record<Subject, { label: string; amount: string }>;
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
