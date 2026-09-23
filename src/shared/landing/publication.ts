import type { Place } from "./place";

/**
 * Brand-local for now; a candidate for `@evinvest/kitstart` (scope not settled).
 * Shape: LANDING-ARCHITECTURE.md §3.3.
 *
 * A place is indexable only once its page says something a neighbour's could
 * not; which facts count depends on whether it has a door to walk into.
 */
export type PublicationField = "storefrontPhoto" | "landmark" | "serviceArea" | "hours";

export interface PublicationPolicy {
  /** What is still missing; empty means the policy is satisfied. */
  required(place: Place<string>): readonly PublicationField[];
}

const hasServiceArea = (place: Place<string>): boolean =>
  place.serviceArea !== null &&
  place.serviceArea.length > 0 &&
  place.serviceArea.every(area => area.kind === "radius" || area.names.some(name => name.trim() !== ""));

const hasHours = (place: Place<string>): boolean => place.hours !== null && place.hours.length > 0;

/** aquafix's four fields. A service-area place can never satisfy it. */
export const STOREFRONT_GATE: PublicationPolicy = {
  required(place) {
    const gaps: PublicationField[] = [];
    const presence = place.presence.kind === "storefront" ? place.presence : null;
    if (!presence?.storefrontPhoto) gaps.push("storefrontPhoto");
    if (!presence?.landmark || Object.values(presence.landmark).some(v => v.trim() === "")) gaps.push("landmark");
    if (!hasServiceArea(place)) gaps.push("serviceArea");
    if (!hasHours(place)) gaps.push("hours");
    return gaps;
  },
};

/** Where the crew goes and when it works — there is no storefront to show. */
export const SERVICE_AREA_GATE: PublicationPolicy = {
  required(place) {
    const gaps: PublicationField[] = [];
    if (!hasServiceArea(place)) gaps.push("serviceArea");
    if (!hasHours(place)) gaps.push("hours");
    return gaps;
  },
};

/**
 * Without a domain nothing is published: there is no canonical URL to index,
 * and a preview host must not compete with the site it previews.
 */
export function isPublished(place: Place<string>, policy: PublicationPolicy, site: { domain: string | null }): boolean {
  return site.domain !== null && policy.required(place).length === 0;
}
