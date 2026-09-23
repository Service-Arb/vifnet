import type { CleaningType, Page } from "@/shared/config/site";

export interface PageCopy {
  /** `<title>` and the OG title. */
  title: string;
  /** `<meta name=description>` and the OG description — one field, both readers. */
  description: string;
}

export interface StatusCopy {
  /** The `<title>`: status pages are `noindex` and carry no `PageCopy`. */
  title: string;
  eyebrow: string;
  /** Split at the accented half, which is how the kit's `StatusScreen` draws it. */
  headline: readonly [string, string];
  body: string;
  action: string;
}

/**
 * Every string that differs between languages. `FR` and `EN` are each checked
 * with `satisfies Text`, and the pair with `satisfies Record<Locale, Text>`: a
 * field added to one language and not the other is a compile error, so there
 * is no missing-key fallback. Language-free facts live in `shared/config`.
 *
 * Brand-local; per LANDING-ARCHITECTURE.md §4.1 it would later extend a shared
 * `CoreText` if a shared package ships one.
 */
export interface Text {
  pages: Record<Page, PageCopy>;
  home: {
    eyebrow: string;
    h1: string;
    lede: string;
    servicesEyebrow: string;
    servicesTitle: string;
  };
  services: Record<CleaningType, { name: string; body: string }>;
  footer: { legal: string };
  notFound: StatusCopy;
  langSwitchLabel: string;
}
