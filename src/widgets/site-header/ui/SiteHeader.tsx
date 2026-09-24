import { Button, LangSwitch } from "@evinvest/kitstart/react";
import type { Copy } from "@/entities/content";
import type { Locale } from "@/shared/config/i18n";
import { Lockup } from "@/shared/ui";

export interface SiteHeaderProps {
  copy: Copy;
  home: string;
  /** Where the quote form is on this page. */
  quoteHref: string;
  langHrefs: Readonly<Record<Locale, string>>;
  locales: readonly Locale[];
  labels: Readonly<Record<Locale, string>>;
}

/**
 * The lock-up, the language switch and — from a tablet up — the quote CTA.
 * Not sticky: on a phone the CTA lives in the call bar. No phone here until
 * the brand has one.
 */
export function SiteHeader({ copy, home, quoteHref, langHrefs, locales, labels }: SiteHeaderProps) {
  const { t, locale } = copy;
  return (
    <header className="flex items-center gap-6 px-[var(--page-px)] py-2 md:py-5">
      <a href={home} aria-label={t.header.home} className="shrink-0">
        <Lockup className="h-[42px] w-[176px]" />
      </a>
      <div className="flex-1" />
      <LangSwitch current={locale} locales={locales} hrefs={langHrefs} labels={labels} label={t.langLabel} className="px-1 py-3 text-sm text-ink-soft" />
      <Button href={quoteHref} variant="outline" size="lg" data-intent="form_open" className="hidden px-5 text-sm font-medium md:inline-flex">
        {t.header.cta}
      </Button>
    </header>
  );
}
