import { assertLaunchable, cardFact, defineSite, SERVICE_AREA_GATE, type OwnerTodo } from "@evinvest/kitstart";
import { COPY_TODO } from "./copy-todo";
import { i18n } from "./i18n";
import { LEAD } from "./lead";
import { PLACES } from "./places";

/**
 * Vifnet as the machinery sees it — routing, the lead funnel, schema.org,
 * analytics and mail read their facts from this one object. The contact facts
 * come from `assets/card.toml` (inlined at build): today the card has none,
 * so the site has no phone, no mailbox and no domain — noindex everywhere,
 * robots disallow, an empty sitemap, and the quote form as the only channel.
 */
export const site = defineSite({
  brand: {
    id: "vifnet",
    name: "Vifnet",
    // The brand name stands in until the owner gives the raison sociale.
    legalName: "Vifnet",
    email: cardFact("SITE_CARD_EMAIL", process.env.SITE_CARD_EMAIL),
    phone: cardFact("SITE_CARD_PHONE", process.env.SITE_CARD_PHONE),
    domain: cardFact("SITE_CARD_SITE", process.env.SITE_CARD_SITE),
    // No schema.org subtype names cleaning; the job types go on the offers.
    businessType: "LocalBusiness",
  },
  i18n,
  ogLocale: { fr: "fr_FR", en: "en_GB" },
  // One place, served at the apex: the crew goes to the customer.
  topology: { kind: "single", place: "vifnet" },
  pages: { home: "" },
  places: PLACES,
  publication: SERVICE_AREA_GATE,
  lead: LEAD,
});

export type PageKey = (typeof site.pageKeys)[number];

/**
 * Facts the owner has not given, listed once rather than found on the page.
 * The Figma note "Copy that states a term" (9:529) proposed promises the
 * company would pay for; none ships until the owner confirms it, so each is a
 * `copy:` line here (`COPY_TODO`, with how it would read) and nowhere in the
 * copy.
 */
export const OWNER_TODO: readonly OwnerTodo[] = [
  { field: "assets/card.toml site", why: "no domain yet — the site is noindex and robots Disallow until there is", blocksLaunch: true },
  { field: "assets/card.toml phone", why: "no public number: no tel: channel, the WhatsApp slot stays hidden", blocksLaunch: false },
  { field: "assets/card.toml email", why: "no public mailbox; lead mail needs LEAD_NOTIFY_TO", blocksLaunch: false },
  { field: "site.brand.legalName", why: "raison sociale as registered; the brand name stands in", blocksLaunch: true },
  { field: "SIRET", why: "mentions légales (LCEN) need the operating entity's SIRET, in the footer's legal line", blocksLaunch: true },
  {
    field: "places[vifnet].serviceArea",
    why: "which communes the crew covers; the Figma chips are guesses, so the service-area band stays hidden",
    blocksLaunch: true,
  },
  { field: "places[vifnet].hours", why: "working hours — the publication gate needs them", blocksLaunch: true },
  { field: "places[vifnet].gbpName", why: "the Google Business Profile's exact name; reviews show once it has some", blocksLaunch: false },
  { field: "SUBJECTS", why: "regular cleaning, end of tenancy and after-works cleaning are held back until the owner confirms them", blocksLaunch: false },
  { field: "PRICES", why: "no price list: the price-table band ships only with real numbers", blocksLaunch: false },
  ...COPY_TODO,
];

assertLaunchable(site, OWNER_TODO);
