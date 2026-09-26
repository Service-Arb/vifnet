import { Button, LangSwitch } from "@evinvest/kitstart/react";
import { telHref } from "@evinvest/marketing";
import type { Copy } from "@/entities/content";
import type { Locale } from "@/shared/config/i18n";
import { Lockup } from "@/shared/ui";
import { type HeaderLink, MobileMenu } from "./MobileMenu";

export type { HeaderLink } from "./MobileMenu";

export interface SiteHeaderProps {
  copy: Copy;
  home: string;
  /** Where the quote form is on this page. */
  quoteHref: string;
  /** The bands this page has, in page order: the page decides, a band without facts has no link. */
  links: readonly HeaderLink[];
  /** The brand's phone, or `null` — then there is no call link, never a dead one. */
  phone: string | null;
  langHrefs: Readonly<Record<Locale, string>>;
  locales: readonly Locale[];
  labels: Readonly<Record<Locale, string>>;
}

const NAV_LINK = "rounded-sm text-sm font-medium text-ink-mid hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

/**
 * Sticky and dark over every band, so the quote is one tap away from anywhere
 * on the page. From a tablet up: the lock-up, the band links, the language
 * switch and the gold CTA. On a phone: the lock-up, a short CTA and a
 * `<details>` menu that opens without JavaScript.
 */
export function SiteHeader({ copy, home, quoteHref, links, phone, langHrefs, locales, labels }: SiteHeaderProps) {
  const { t, locale } = copy;
  const lang = { current: locale, locales, hrefs: langHrefs, labels, label: t.langLabel };
  return (
    <header className="dark sticky top-0 z-40 border-b border-border bg-background/95 text-ink backdrop-blur-sm">
      <div className="flex h-16 items-center gap-2 px-[var(--page-px)] md:gap-6">
        <a href={home} aria-label={t.header.home} className="mr-auto shrink-0 rounded-sm md:mr-0">
          <Lockup className="h-8 w-auto min-[360px]:h-9 md:h-10" />
        </a>
        <nav aria-label={t.nav.menu} className="hidden flex-1 items-center justify-center gap-7 md:flex">
          {links.map(link => (
            <a key={link.href} href={link.href} className={NAV_LINK}>
              {link.label}
            </a>
          ))}
        </nav>
        {phone && (
          <a href={telHref(phone)} className={`hidden md:inline ${NAV_LINK}`}>
            {phone}
          </a>
        )}
        <LangSwitch {...lang} className="hidden text-sm text-ink md:flex" />
        <Button href={quoteHref} size="lg" data-intent="form_open" className="shrink-0 rounded-sm px-4 text-sm font-bold">
          <span className="md:hidden">{t.header.ctaCompact}</span>
          <span className="hidden md:inline">{t.header.cta}</span>
        </Button>
        <MobileMenu label={t.nav.menu} links={links} phone={phone}>
          <LangSwitch {...lang} className="py-3 text-sm text-ink" />
        </MobileMenu>
      </div>
    </header>
  );
}
