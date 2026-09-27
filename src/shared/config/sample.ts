/**
 * The Figma file's sample contact, shown where the frame shows it — the header,
 * the phone menu, the FAQ, the gold band, the footer and the sticky bar. It is
 * the frame's fictional number (555-01xx), not the brand's: `site.brand.phone`
 * (from `assets/card.toml`) stays empty, so no structured data, OG card or
 * notification ever carries it. OWNER_TODO "design sample content" keeps a
 * launch from shipping it.
 */
export const SAMPLE_PHONE = { display: "(208) 555-0192", href: "tel:+12085550192" } as const;

/**
 * What the About page's map shows once asked (Figma MapFacade 38:1485): the
 * frame's sample town, not the place's — a `service-area` place has no
 * address a map could be drawn from.
 */
export const SAMPLE_MAP_QUERY = "Boise, Idaho";
