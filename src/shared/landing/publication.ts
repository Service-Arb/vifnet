import type { Place } from "./place";

/**
 * Brand-local for now; a candidate for `@evinvest/kitstart` (scope not settled).
 * Shape: LANDING-ARCHITECTURE.md §3.3, without the storefront gate.
 *
 * A place is indexable only once its page says something a neighbour's could
 * not: for a business without a door, where the crew goes and when it works.
 */
export type PublicationField = "serviceArea" | "hours";

export interface PublicationPolicy {
  /** What is still missing; empty means the policy is satisfied. */
  required(place: Place<string>): readonly PublicationField[];
}

export const SERVICE_AREA_GATE: PublicationPolicy = {
  required(place) {
    const gaps: PublicationField[] = [];
    const areas = place.serviceArea ?? [];
    if (areas.length === 0 || !areas.every(area => area.names.some(name => name.trim() !== ""))) {
      gaps.push("serviceArea");
    }
    if (!place.hours || place.hours.length === 0) gaps.push("hours");
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
