import { assertLaunchable, defineSite, SERVICE_AREA_GATE, type LeadSchema, type OwnerTodo } from "@/shared/landing";
import { i18n } from "./i18n";
import { PLACES } from "./places";

/**
 * The kinds of job the quote form offers — the values it posts and the lead
 * store keeps. Only what the portfolio in `assets/profile_images/` actually
 * shows; routine cleaning and end-of-tenancy wait for the owner (`OWNER_TODO`).
 */
export const CLEANING_TYPES = ["deep", "after_works", "upholstery", "exterior", "other"] as const;
export type CleaningType = (typeof CLEANING_TYPES)[number];

/** Whole square metres; a quote for a flat and one for a hotel floor differ by the surface. */
export const SURFACE_M2 = { name: "surface_m2", min: 1, max: 100_000 } as const;

export const LEAD = {
  subjects: CLEANING_TYPES,
  extras: [{ name: SURFACE_M2.name, max: String(SURFACE_M2.max).length }],
  validate(lead) {
    const raw = lead.extras[SURFACE_M2.name];
    if (raw === undefined || raw === "") return null;
    if (!/^\d+$/.test(raw)) return `${SURFACE_M2.name} must be a whole number`;
    const m2 = Number(raw);
    return m2 >= SURFACE_M2.min && m2 <= SURFACE_M2.max ? null : `${SURFACE_M2.name} out of range`;
  },
} satisfies LeadSchema<CleaningType>;

export const SITE = defineSite({
  brand: {
    /** `data-brand` palette scope, `brand_id` in analytics. */
    id: "vifnet",
    name: "Vifnet",
    legalName: "Vifnet",
    email: null,
    phone: null,
    domain: null,
    // No schema.org subtype names cleaning; the job types go on `Service.serviceType`.
    businessType: "LocalBusiness",
  },
  i18n,
  topology: { kind: "single", place: "vifnet" },
  pages: { home: "" },
  places: PLACES,
  publication: SERVICE_AREA_GATE,
  lead: LEAD,
});

export type Page = keyof typeof SITE.pages;

export const OWNER_TODO: readonly OwnerTodo[] = [
  { field: "brand.domain", why: "no domain yet — the site is noindex and robots Disallow until there is", blocksLaunch: true },
  { field: "brand.phone", why: "no public number; the page has no tel: channel", blocksLaunch: true },
  { field: "brand.email", why: "no public mailbox", blocksLaunch: true },
  { field: "brand.legalName", why: "raison sociale as registered; the brand name stands in", blocksLaunch: true },
  { field: "SIRET", why: "mentions légales (LCEN) need the operating entity's SIRET", blocksLaunch: true },
  { field: "places[vifnet].serviceArea", why: "which communes the crew covers — the publication gate needs it", blocksLaunch: true },
  { field: "places[vifnet].hours", why: "working hours — the publication gate needs them", blocksLaunch: true },
  { field: "places[vifnet].gbpName", why: "the Google Business Profile's exact name, once it exists", blocksLaunch: false },
  {
    field: "CLEANING_TYPES",
    why: "read off the portfolio photos, not confirmed; routine cleaning and end of tenancy held back until the owner says",
    blocksLaunch: true,
  },
  { field: "prices", why: "no price list yet — the page states none", blocksLaunch: false },
  { field: "assets/brand.toml", why: "a placeholder palette until the design exists", blocksLaunch: false },
];

assertLaunchable(SITE, OWNER_TODO);
