import type { Place } from "@/shared/landing";
import type { Locale } from "./i18n";

/**
 * Vifnet's one place. A service-area business: the crew goes to the customer,
 * so there is no address to publish — and `Place` has no field for one;
 * `tests/place.test.ts` holds that with `@ts-expect-error`.
 *
 * Every `null` is a fact the owner has not given yet (see `OWNER_TODO` in
 * `site.ts`); the publication gate keeps the page `noindex` until they are in.
 */
export const PLACE = {
  slug: "vifnet",
  gbpName: "Vifnet",
  name: { fr: "Vifnet", en: "Vifnet" },
  presence: { kind: "service-area" },
  serviceArea: null,
  channels: { phone: null, whatsapp: null },
  hours: null,
  rating: null,
} satisfies Place<Locale>;

export const PLACES: readonly Place<Locale>[] = [PLACE];
