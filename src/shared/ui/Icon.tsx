export type IconName = "phone" | "home" | "home-outline" | "check" | "chevron-down" | "shield-check" | "menu" | "star" | "google-g";

/**
 * Where an icon's file overhangs its box, as the frame places it (`inset-[…]`
 * in the design context): the phone's and the star's exports are wider than
 * the square they sit in.
 */
const OVERHANG: Partial<Record<IconName, string>> = {
  phone: "inset-[-5.21%_-2.25%_0_-4.33%]",
  star: "inset-[-1.04%_0_0_0]",
};

/**
 * One of the frame's icons (Figma 5:5) at the size of its use, in the text
 * colour around it (`app/globals.css` masks the file over `currentColor`).
 * Decorative: whatever it stands for is written beside it.
 */
export function Icon({ name, className }: { name: IconName; className: string }) {
  return (
    <span aria-hidden="true" className={`relative block shrink-0 ${className}`}>
      <span className={`vf-icon vf-icon-${name} absolute ${OVERHANG[name] ?? "inset-0"}`} />
    </span>
  );
}
