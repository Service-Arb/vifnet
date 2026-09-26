import type { CopySlice, CoreText, Said as CoreSaid } from "@evinvest/kitstart";
import type { Locale } from "@/shared/config/i18n";
import type { Subject } from "@/shared/config/lead";
import type { PairKey } from "@/shared/portfolio";
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

/**
 * Every string that differs between languages. It extends `CoreText`, the
 * words the machinery prints; the rest is Vifnet's own sections, one key per
 * Figma frame. `FR` and `EN` are checked with `satisfies Text`, so a key in
 * one and not the other is a compile error.
 *
 * Nothing here states a term the owner has not confirmed (OWNER_TODO, the
 * "copy:" lines): no fixed price, no supplies, no re-clean, no keys.
 */
export interface Text extends CoreText<PageKey, Facts> {
  /** `ctaCompact` fits the phone's header beside the lock-up and the menu. */
  header: { cta: string; ctaCompact: string; home: string };
  /** The header's links to the bands; `menu` names the phone's menu button. */
  nav: { services: string; work: string; steps: string; faq: string; menu: string };
  hero: { title: string; lede: string; cta: string; toWork: string; photoAlt: string };
  beforeAfter: {
    eyebrow: string;
    title: string;
    lede: string;
    before: string;
    after: string;
    /** The slider's accessible name. */
    slider: string;
    /** The slider's `aria-valuetext`, `{n}` the percent of the frame that is "before". */
    position: string;
    /** The pair picker's accessible name. */
    picker: string;
    pairs: Record<PairKey, string>;
  };
  services: {
    eyebrow: string;
    title: string;
    lede: string;
    onQuote: string;
    ask: string;
    items: Record<Subject, { name: string; body: string; photoAlt: string }>;
  };
  priceTable: { title: string; lede: string; service: string; price: string; detail: Record<Subject, string> };
  howItWorks: { eyebrow: string; title: string; steps: readonly { title: string; body: string }[] };
  reviews: { title: string; summary: (value: string, count: number) => string };
  serviceArea: { title: string; lede: string };
  faqEyebrow: string;
  faqTitle: string;
  faqs: readonly { q: string; a: string }[];
  closing: { title: string; lede: string; photoAlt: string };
  subjects: Record<Subject, string>;
  quoteLabels: {
    subject: string;
    choose: string;
    surface: string;
    surfaceHint: string;
    locality: string;
    localityHint: string;
    mobile: string;
    mobileHint: string;
    callback: string;
  };
  footer: { tagline: string; legal: string; copyright: (year: number) => string };
  /** The apex of a network of places: its `<head>` and the directory's link. */
  brandPage: { title: string; description: string; open: string };
  /** The contact bar's accessible name. */
  contactLabel: string;
  langLabel: string;
}

export type Copy = CopySlice<Locale, Text, Facts>;
