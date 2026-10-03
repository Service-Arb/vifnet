import { telHref } from "@evinvest/kitstart";

/** A number as a page prints it and dials it. */
export interface PhoneLink {
  display: string;
  href: string;
}

/**
 * The Figma file's sample contact, shown where the frame shows it — the header,
 * the phone menu, the FAQ, the gold band, the footer and the sticky bar — until
 * the place has a number of its own (`shownPhone`). It is the frame's
 * fictional number (555-01xx), not the brand's: `site.brand.phone` (from
 * `assets/card.toml`) stays empty, so no structured data, OG card or
 * notification ever carries it. OWNER_TODO "design sample content" keeps a
 * launch from shipping it.
 */
export const SAMPLE_PHONE: PhoneLink = { display: "(208) 555-0192", href: "tel:+12085550192" };

/**
 * The number a page shows: the place's own once it has one — `copy.f.phone`,
 * `contactOf` over the place merged with the panel's (`LOCATIONS_API_URL`) —
 * else the frame's sample. As the source wrote it, dialled digits only.
 */
export function shownPhone(live: string | null): PhoneLink {
  return live === null ? SAMPLE_PHONE : { display: live, href: telHref(live) };
}

/**
 * What the About page's map shows once asked (Figma MapFacade 38:1485): the
 * frame's sample town, not the place's — a `service-area` place has no
 * address a map could be drawn from.
 */
export const SAMPLE_MAP_QUERY = "Boise, Idaho";
