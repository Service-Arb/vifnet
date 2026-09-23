import { LOCALES, type Locale } from "@/shared/config/i18n";

/**
 * `FR · EN`, each linking to the same page in that language. The `?lang=` is
 * what mints the cookie in the proxy, so the choice survives the next bare
 * visit — with no JavaScript.
 */
export function LangSwitch({
  current,
  hrefs,
  label,
}: {
  current: Locale;
  /** The page's URL in each language, before `?lang=` is added. */
  hrefs: Record<Locale, string>;
  label: string;
}) {
  return (
    <nav aria-label={label} className="flex items-center gap-1.5 text-sm">
      {LOCALES.map((locale, i) => (
        <span key={locale} className="flex items-center gap-1.5">
          {i > 0 && <span className="opacity-40">·</span>}
          <a
            href={`${hrefs[locale]}?lang=${locale}`}
            hrefLang={locale}
            lang={locale}
            aria-current={locale === current ? "true" : undefined}
            className={locale === current ? "font-semibold" : "opacity-60 hover:opacity-100"}
          >
            {locale.toUpperCase()}
          </a>
        </span>
      ))}
    </nav>
  );
}
