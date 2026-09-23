import { createLocaleRegistry } from "@evinvest/i18n";

/**
 * Both languages carry a prefix, as on aquafix: a new site has no legacy URLs,
 * so there is no unprefixed canonical to protect. French is the default — the
 * business works in France — and is what a header-less visitor is sent to.
 */
export const i18n = createLocaleRegistry({
  locales: ["fr", "en"],
  labels: { fr: "Français", en: "English" },
  default: "fr",
  prefixDefaultLocale: true,
  hreflang: { fr: "fr-FR" },
});

export type Locale = (typeof i18n.locales)[number];

export const LOCALES: readonly Locale[] = i18n.locales;
export const DEFAULT_LOCALE: Locale = i18n.defaultLocale;

export function isLocale(value: unknown): value is Locale {
  return i18n.isLocale(value);
}

/** One value per locale — spelled out, so a third locale is a compile error here. */
export function perLocale<T>(fn: (locale: Locale) => T): Record<Locale, T> {
  return { fr: fn("fr"), en: fn("en") };
}

/** `og:locale` — a region is required there, unlike `hreflang`. */
export const OG_LOCALE: Record<Locale, string> = { fr: "fr_FR", en: "en_GB" };
