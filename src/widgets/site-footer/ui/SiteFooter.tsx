import { LangSwitch } from "@evinvest/kitstart/react";
import type { Copy } from "@/entities/content";
import type { Locale } from "@/shared/config/i18n";
import { Lockup } from "@/shared/ui";

export interface SiteFooterProps {
  copy: Copy;
  year: number;
  langHrefs: Readonly<Record<Locale, string>>;
  locales: readonly Locale[];
  labels: Readonly<Record<Locale, string>>;
}

/**
 * One dark line: the lock-up, the legal line, the language switch — stacked
 * and centred on a phone. No street address (a service-area business has
 * none); the raison sociale and SIRET join the legal line once the owner
 * gives them (OWNER_TODO).
 */
export function SiteFooter({ copy, year, langHrefs, locales, labels }: SiteFooterProps) {
  const { t, locale } = copy;
  return (
    <footer id="footer" className="dark border-t border-border bg-background px-[var(--page-px)] py-8 text-ink">
      <div className="flex flex-col items-center gap-3 text-center md:flex-row md:justify-between md:gap-8 md:text-left">
        <Lockup className="h-8 w-auto shrink-0" />
        <p className="flex flex-col gap-1 text-sm text-ink-soft md:flex-row md:gap-4">
          <span>{t.footer.copyright(year)}</span>
          <span>{t.footer.legal}</span>
        </p>
        <LangSwitch current={locale} locales={locales} hrefs={langHrefs} labels={labels} label={t.langLabel} className="py-3 text-sm text-ink-mid md:py-0" />
      </div>
    </footer>
  );
}
