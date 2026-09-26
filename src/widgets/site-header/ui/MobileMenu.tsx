import { SAMPLE_PHONE } from "@/shared/config/sample";
import { CloseMenu } from "./CloseMenu";

export interface HeaderLink {
  href: string;
  label: string;
}

/** The checkbox the burger toggles; the panel shows while it is checked. */
export const MENU_ID = "nav-menu";

const LINK = "block py-2.5 text-sm leading-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/**
 * The phone's menu (Figma 8:132): under the bar, in the header's flow — it
 * pushes the page down as the frame draws it — on the deepest forest. It shows
 * while the header's checkbox is checked, so it opens before any script; the
 * one script, `CloseMenu`, only closes it after a link, a press outside or Esc.
 */
export function MobileMenu({ label, links }: { label: string; links: readonly HeaderLink[] }) {
  return (
    <nav
      id={`${MENU_ID}-panel`}
      aria-label={label}
      // Literal ids: Tailwind reads class names from the source, not at run time.
      className="hidden flex-col gap-1 border-t border-white/5 bg-popover px-4 pb-4 group-has-[#nav-menu:checked]:flex md:group-has-[#nav-menu:checked]:hidden"
    >
      {links.map(link => (
        <a key={link.label} href={link.href} className={`${LINK} border-b border-white/5 text-white/70 hover:text-white`}>
          {link.label}
        </a>
      ))}
      <a href={SAMPLE_PHONE.href} className={`${LINK} self-start font-semibold text-primary`}>
        {SAMPLE_PHONE.display}
      </a>
      <CloseMenu toggle={MENU_ID} />
    </nav>
  );
}
