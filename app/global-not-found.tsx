import "./globals.css";
import { StatusScreen } from "@evinvest/uikit";
import { headers } from "next/headers";
import { copyFor } from "@/entities/content";
import { LOCALE_HEADER } from "@/features/locale-routing";
import { DEFAULT_LOCALE, isLocale } from "@/shared/config/i18n";
import { SITE } from "@/shared/config/site";

/**
 * The 404 for any URL no route matches. The root layout sits under `[locale]`,
 * so a segment `not-found.tsx` never reaches the HTML shell for an unmatched
 * path; Next's answer for that layout is this file, which renders its own
 * `<html>`. The language is the path's, passed on by the proxy. Next emits
 * `noindex` for it on its own.
 */
export default async function GlobalNotFound() {
  const asked = (await headers()).get(LOCALE_HEADER);
  const locale = isLocale(asked) ? asked : DEFAULT_LOCALE;
  const status = copyFor(locale).t.notFound;
  return (
    <html lang={locale} data-brand={SITE.brand.id} className="light">
      <body>
        <title>{`${status.title} · ${SITE.brand.name}`}</title>
        <StatusScreen
          accent="warn"
          eyebrow={status.eyebrow}
          code="404"
          headlineLead={status.headline[0]}
          headlineAccent={status.headline[1]}
          subtext={status.body}
          links={[{ label: status.action, href: `/${locale}` }]}
        />
      </body>
    </html>
  );
}
