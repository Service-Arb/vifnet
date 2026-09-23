import { LangSwitch } from "@evinvest/kitstart/react";
import type { Copy } from "@/entities/content";
import type { Locale } from "@/shared/config/i18n";
import { Lockup, TYPE } from "@/shared/ui";

export interface SiteFooterProps {
  copy: Copy;
  year: number;
  langHrefs: Readonly<Record<Locale, string>>;
  locales: readonly Locale[];
  labels: Readonly<Record<Locale, string>>;
}

/**
 * Dark, like the closing band above it. No street address (a service-area
 * business has none); the raison sociale and SIRET join the legal line once
 * the owner gives them (OWNER_TODO).
 */
export function SiteFooter({ copy, year, langHrefs, locales, labels }: SiteFooterProps) {
  const { t, locale } = copy;
  return (
    <footer id="footer" className="dark flex flex-col gap-6 border-t border-border bg-background px-[var(--page-px)] py-10 text-ink">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex flex-col gap-1.5">
          <Lockup className="h-[42px] w-[176px]" />
          <p className="text-sm text-ink-mid">{t.footer.tagline}</p>
        </div>
        <div className="flex-1" />
        <LangSwitch current={locale} locales={locales} hrefs={langHrefs} labels={labels} label={t.langLabel} className="px-1 py-3 text-sm text-ink-soft" />
      </div>
      <p className={`flex flex-col gap-2 ${TYPE.fine} text-ink-soft md:flex-row md:gap-6`}>
        <span>{t.footer.copyright(year)}</span>
        <span>{t.footer.legal}</span>
      </p>
    </footer>
  );
}
