import type { PhoneLink } from "@/shared/lib/phone";
import { DetailsDismiss, Icon } from "@/shared/ui";

export interface HeaderLink {
  href: string;
  label: string;
}

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const LINK = `block py-3 text-sm leading-5 ${FOCUS}`;

/**
 * The phone's burger and menu (Figma NavBar Mobile/Open 8:114). A `<details>`,
 * so it opens before any script. The panel is an overlay under the bar —
 * `absolute` in the sticky header, which is its containing block — so opening
 * it never changes the height of the header or the page and the page does not
 * move; `app/globals.css` locks the page's scroll while it is open, and the
 * scrim over the page closes it. Hidden from `md`, where the row shows the nav.
 * The place's number closes the list when it has one; without it the last
 * link drops its rule, so no hairline hangs over the panel's edge.
 */
export function MobileMenu({ label, links, phone }: { label: string; links: readonly HeaderLink[]; phone: PhoneLink | null }) {
  return (
    <details data-nav-menu className="group/menu md:hidden">
      <summary
        aria-label={label}
        data-band="menu-toggle"
        className="relative block cursor-pointer list-none rounded-sm p-1 text-white before:absolute before:-inset-[7px] before:content-[''] focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden"
      >
        <Icon name="menu" className="size-[22px] group-open/menu:hidden" />
        <Icon name="x" className="size-[22px] not-group-open/menu:hidden" />
      </summary>
      {/* `--bar-h` (app/globals.css): the scrim covers what is under the bar. */}
      <div data-dismiss aria-hidden="true" className="fixed inset-x-0 top-(--bar-h) bottom-0 hidden bg-black/50 group-open/menu:block" />
      <nav
        id="nav-menu-panel"
        aria-label={label}
        className="absolute inset-x-0 top-full hidden max-h-[calc(100dvh-var(--bar-h))] flex-col gap-1 overflow-y-auto overscroll-contain border-t border-white/5 bg-popover px-4 pb-4 group-open/menu:flex"
      >
        {links.map(link => (
          <a key={link.label} href={link.href} className={`${LINK} border-b border-white/5 text-white/70 last:border-b-0 hover:text-white`}>
            {link.label}
          </a>
        ))}
        {phone && (
          <a href={phone.href} className={`${LINK} self-start font-semibold text-primary`}>
            {phone.display}
          </a>
        )}
      </nav>
      {/* Tailwind's `md`, as `md:hidden` above and the scroll lock in app/globals.css. */}
      <DetailsDismiss closeFrom="(min-width: 48rem)" />
    </details>
  );
}
