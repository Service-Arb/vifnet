import type { LocaleRegistry } from "@evinvest/i18n";
import type { E164, Place } from "./place";
import type { PublicationPolicy } from "./publication";

/**
 * The composition root of a landing: every brand fact the shared machinery
 * reads, in one object built in `shared/config` and passed down.
 *
 * Brand-local for now; a candidate for `@evinvest/kitstart` (scope not settled).
 * Shape: LANDING-ARCHITECTURE.md §2.2, §2.4, §4.2 — only the part this brand
 * reads today.
 */

/** What a visitor sent, before it is screened or stored. */
export interface LeadCandidate<S extends string> {
  subject: S;
  locality: string;
  mobile: string;
  extras: Readonly<Record<string, string>>;
}

export interface LeadSchema<S extends string> {
  subjects: readonly S[];
  /** Brand-specific fields beyond the fixed three; `max` is the length cap in characters. */
  extras?: readonly { name: string; max: number }[];
  /** A reason to refuse, or `null`. */
  validate?: (lead: LeadCandidate<S>) => string | null;
}

export type Topology = { kind: "subdomains"; apex: "directory" } | { kind: "single"; place: string };

export interface SiteConfig<L extends string, P extends string, S extends string> {
  brand: {
    id: string;
    name: string;
    legalName: string;
    email: string | null;
    /** `null` → no `tel:` channel anywhere on the site. */
    phone: E164 | null;
    /** `null` → the whole site is `noindex`, robots `Disallow`, the sitemap empty. */
    domain: string | null;
    /** A schema.org `LocalBusiness` subtype, or `LocalBusiness` itself. */
    businessType: string;
    priceRange?: string;
  };
  i18n: LocaleRegistry<L>;
  topology: Topology;
  /** Locale- and place-free suffixes; `home` is `""`. */
  pages: Readonly<Record<P, `/${string}` | "">> & { readonly home: "" };
  places: readonly Place<L>[];
  publication: PublicationPolicy;
  lead: LeadSchema<S>;
}

export type Site<L extends string, P extends string, S extends string> = Readonly<SiteConfig<L, P, S>>;

/**
 * A fact the owner has not supplied. `blocksLaunch` items keep the site off a
 * domain: listed once here rather than discovered on the page.
 */
export interface OwnerTodo {
  field: string;
  why: string;
  blocksLaunch: boolean;
}

/** Validates what the types cannot; throws at import, so a bad config fails the build. */
export function defineSite<const L extends string, const P extends string, const S extends string>(
  config: SiteConfig<L, P, S>,
): Site<L, P, S> {
  const slugs = config.places.map(place => place.slug);
  if (new Set(slugs).size !== slugs.length) throw new Error(`defineSite: duplicate place slug in ${slugs.join(", ")}`);
  if (config.topology.kind === "single") {
    if (config.places.length !== 1) throw new Error("defineSite: a single-place topology has exactly one place");
    if (slugs[0] !== config.topology.place) {
      throw new Error(`defineSite: topology names "${config.topology.place}", the place is "${slugs[0] ?? ""}"`);
    }
  }
  const { domain } = config.brand;
  if (domain !== null && !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain)) {
    throw new Error(`defineSite: brand.domain must be a bare lowercase host, got ${JSON.stringify(domain)}`);
  }
  if (config.lead.subjects.length === 0) throw new Error("defineSite: the lead needs at least one subject");
  return config;
}

/** A domain is the launch; it may not be set while a blocking fact is still missing. */
export function assertLaunchable(site: { brand: { domain: string | null } }, todos: readonly OwnerTodo[]): void {
  if (site.brand.domain === null) return;
  const open = todos.filter(todo => todo.blocksLaunch);
  if (open.length > 0) {
    throw new Error(`brand.domain is set but launch-blocking facts are missing: ${open.map(t => t.field).join(", ")}`);
  }
}

/** `https://<domain>`, or `null` before there is one. */
export function siteOrigin(site: { brand: { domain: string | null } }): string | null {
  return site.brand.domain === null ? null : `https://${site.brand.domain}`;
}
