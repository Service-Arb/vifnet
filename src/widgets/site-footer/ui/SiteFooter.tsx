import { withLang } from "@evinvest/kitstart/react";
import type { Copy } from "@/entities/content";
import { SAMPLE_PHONE } from "@/shared/config/sample";
import { Logo } from "@/shared/ui";

export interface SiteFooterProps {
  copy: Copy;
  year: number;
  /** The other language: this page in it, and its name in itself. */
  other: { locale: string; href: string; label: string };
}

const LINK = "hover:text-white/70 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

/**
 * The frame's footer (13:521 / 15:918) on forest-deep: the small logo, the
 * line, and the row of links — a row from `md`, a centred stack below. Privacy
 * and Terms are text as the frame draws them: there are no such pages to link
 * to yet. The language switch is one more item of that row, in its style: the
 * other language's name, through the kit's `?lang=` link (`withLang`).
 */
export function SiteFooter({ copy, year, other }: SiteFooterProps) {
  const { t } = copy;
  return (
    <footer id="footer" className="dark bg-popover px-[var(--page-px)] py-8 text-ink">
      <div className="flex flex-col items-center gap-3 text-sm leading-5 text-white/40 md:flex-row md:justify-between">
        <Logo size="sm" />
        <p className="text-center">{t.footer.copyright(year)}</p>
        <div className="flex flex-wrap justify-center gap-4 whitespace-nowrap">
          <span>{t.footer.privacy}</span>
          <span>{t.footer.terms}</span>
          <a href={SAMPLE_PHONE.href} className={LINK}>
            {SAMPLE_PHONE.display}
          </a>
          <a href={withLang(other.href, other.locale)} hrefLang={other.locale} lang={other.locale} className={LINK}>
            {other.label}
          </a>
        </div>
      </div>
    </footer>
  );
}
