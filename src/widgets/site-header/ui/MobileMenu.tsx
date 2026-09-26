import { telHref } from "@evinvest/marketing";
import type { ReactNode } from "react";
import { CloseMenu } from "./CloseMenu";

export interface HeaderLink {
  href: string;
  label: string;
}

/**
 * The phone's menu: a `<details>`, so the button opens and closes it before
 * any script arrives. The panel hangs under the header at full width, on the
 * deepest forest (`popover`). The one script, `CloseMenu`, only closes it
 * after a link is followed or on Esc.
 */
export function MobileMenu({ label, links, phone, children }: { label: string; links: readonly HeaderLink[]; phone: string | null; children: ReactNode }) {
  return (
    <details className="group md:hidden">
      <summary
        aria-label={label}
        className="flex size-11 cursor-pointer list-none items-center justify-center rounded-sm text-ink hover:bg-hover focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path className="group-open:hidden" d="M4 7h16M4 12h16M4 17h16" />
          <path className="hidden group-open:block" d="M6 6l12 12M18 6 6 18" />
        </svg>
      </summary>
      <nav aria-label={label} className="absolute inset-x-0 top-full border-b border-border bg-popover px-[var(--page-px)] pb-2">
        <ul>
          {links.map(link => (
            <li key={link.href} className="border-b border-border">
              <a href={link.href} className="block py-3 text-sm text-ink-mid hover:text-ink">
                {link.label}
              </a>
            </li>
          ))}
          {phone && (
            <li className="border-b border-border">
              <a href={telHref(phone)} className="block py-3 text-sm font-semibold text-primary-ink">
                {phone}
              </a>
            </li>
          )}
        </ul>
        {children}
      </nav>
      <CloseMenu />
    </details>
  );
}
