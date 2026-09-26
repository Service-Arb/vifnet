import type { CopySlice, CoreText, Said as CoreSaid } from "@evinvest/kitstart";
import type { Locale } from "@/shared/config/i18n";
import type { Bedrooms, Subject } from "@/shared/config/lead";
import type { PageKey } from "@/shared/config/site";

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
  nav: { services: string; reviews: string; pricing: string; faq: string; menu: string; book: string; home: string };
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
  sticky: { title: string; lede: string; call: string; book: string };
  /** The apex of a network of places: its `<head>` and the directory's link. */
  brandPage: { title: string; description: string; open: string };
}

export type Copy = CopySlice<Locale, Text, Facts>;
