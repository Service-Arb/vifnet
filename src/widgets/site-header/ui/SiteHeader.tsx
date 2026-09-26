import { Button } from "@evinvest/kitstart/react";
import type { Copy } from "@/entities/content";
import { SAMPLE_PHONE } from "@/shared/config/sample";
import { Icon, Logo, Stars } from "@/shared/ui";
import { type HeaderLink, MENU_ID, MobileMenu } from "./MobileMenu";

export type { HeaderLink } from "./MobileMenu";

export interface SiteHeaderProps {
  copy: Copy;
  home: string;
  /** Where the quote form is on this page. */
  quoteHref: string;
  /** The bands the header links to, in the frame's order. */
  links: readonly HeaderLink[];
}

const QUIET = "text-sm leading-5 font-medium text-white/70";

/**
 * The frame's NavBar (8:143): sticky, forest at 95 % over a blur. From a
 * tablet up: the logo, the band links, the rating (from `sm`), the phone
 * (from `lg`) and the gold "Book Now". On a phone: the logo, "Book Now" and
 * the burger, whose menu opens under the bar.
 */
export function SiteHeader({ copy, home, quoteHref, links }: SiteHeaderProps) {
  const { t } = copy;
  return (
    <header className="group dark sticky top-0 z-40 border-b border-white/5 bg-background/95 text-ink backdrop-blur-sm">
      <input type="checkbox" id={MENU_ID} aria-label={t.nav.menu} aria-controls={`${MENU_ID}-panel`} className="sr-only md:hidden" />
      <div className="flex h-16 items-center justify-between px-[var(--page-px)]">
        <a href={home} aria-label={t.nav.home} className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
          <Logo />
        </a>
        <nav aria-label={t.nav.menu} className="hidden items-center gap-7 md:flex">
          {links.map(link => (
            <a key={link.label} href={link.href} className={`${QUIET} hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring`}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <p className="hidden items-center gap-1.5 sm:flex">
            <Stars />
            <span className={`flex gap-1 ${QUIET}`}>
              <span>{t.rating.value}</span>
              <span className="text-white/40">{t.rating.count}</span>
            </span>
          </p>
          <a href={SAMPLE_PHONE.href} className={`hidden items-center gap-1.5 border-l border-white/10 pl-3 lg:flex ${QUIET} hover:text-white`}>
            <Icon name="phone" className="size-[13px]" />
            {SAMPLE_PHONE.display}
          </a>
          <Button href={quoteHref} data-intent="form_open" className="h-auto rounded-lg px-4 py-2 text-sm leading-5 font-bold hover:bg-amber-400">
            {t.nav.book}
          </Button>
          <label
            htmlFor={MENU_ID}
            data-band="menu-toggle"
            className="cursor-pointer rounded-sm p-1 text-white group-has-[#nav-menu:focus-visible]:outline-2 group-has-[#nav-menu:focus-visible]:outline-ring md:hidden"
          >
            <Icon name="menu" className="size-[22px]" />
          </label>
        </div>
      </div>
      <MobileMenu label={t.nav.menu} links={links} />
    </header>
  );
}
