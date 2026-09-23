import { describe, expect, it } from "vitest";
import { copyFor, TEXT, type Facts } from "@/entities/content";
import { i18n, type Locale } from "@/shared/config/i18n";
import { SUBJECTS } from "@/shared/config/lead";
import { OWNER_TODO, site } from "@/shared/config/site";
import { PAIRS } from "@/shared/portfolio";

// Completeness is the compiler's: `FR` and `EN` satisfy one `Text`. What the
// type cannot see is an empty string, a sentence that states a term the owner
// has not confirmed, or a fact written by hand.

const facts = (): Facts => ({ place: site.brand.name, phone: site.brand.phone });

/** Every leaf string with its path; functions are called on the facts. */
function leaves(value: unknown, f: Facts, path = ""): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (typeof value === "function") return leaves(value(f, 1), f, `${path}()`);
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, f, `${path}[${i}]`));
  if (typeof value === "object" && value !== null) return Object.entries(value).flatMap(([k, v]) => leaves(v, f, path ? `${path}.${k}` : k));
  return [];
}

const copyOf = (locale: Locale) => leaves(TEXT[locale], facts());

/**
 * The owner-unconfirmed terms of the Figma note 9:529, as they would read in
 * either language. Each is an `OWNER_TODO` "copy:" line; none may ship.
 * Photo descriptions (`photoAlt`) say what a picture shows, not a promise.
 */
const UNCONFIRMED: Record<Locale, RegExp> = {
  fr: /prix ferme|par écrit|ne change pas|matériel|apport|24 ?h|sans frais|clés|tôt le matin|fermeture|facturé|réfrigérateur|injection|haute pression|fin de bail|entretien régulier/i,
  en: /fixed price|in writing|does not change|equipment|supplies|24 ?h|free of charge|keys|early morning|closing time|charged|fridge|extraction|pressure|end of tenancy|regular cleaning/i,
};

describe("the copy", () => {
  it.each(i18n.locales)("has no empty string (%s)", locale => {
    expect(copyOf(locale).filter(([, s]) => s.trim() === "")).toEqual([]);
  });

  it("has the same shape in both languages", () => {
    expect(copyOf("en").map(([p]) => p)).toEqual(copyOf("fr").map(([p]) => p));
  });

  it.each(i18n.locales)("states no term the owner has not confirmed (%s)", locale => {
    const said = copyOf(locale).filter(([path, s]) => !path.endsWith("photoAlt") && UNCONFIRMED[locale].test(s));
    expect(said).toEqual([]);
  });

  it("keeps each of those terms listed for the owner", () => {
    expect(OWNER_TODO.filter(t => t.field.startsWith("copy:")).length).toBeGreaterThanOrEqual(7);
  });

  it.each(i18n.locales)("writes no phone number by hand (%s)", locale => {
    // The mobile field's placeholder is an example, not the brand's number.
    const numbers = copyOf(locale).filter(([path, s]) => path !== "quoteLabels.mobileHint" && /(\+33|\b0[1-9])[\d\s.]{8,}/.test(s));
    expect(numbers).toEqual([]);
  });

  it.each(i18n.locales)("names no street, map or premises to visit (%s)", locale => {
    const said = copyOf(locale).filter(([, s]) => /\b(rue|avenue|boulevard|street|google maps|itinéraire|directions)\b/i.test(s));
    expect(said).toEqual([]);
  });

  it.each(i18n.locales)("words every confirmed service and every before/after pair (%s)", locale => {
    const { t } = copyFor(locale, facts());
    for (const s of SUBJECTS) expect(t.services.items[s].name, s).toBe(t.subjects[s]);
    for (const p of PAIRS) expect(t.beforeAfter.pairs[p], p).not.toBe("");
    expect(t.beforeAfter.position).toContain("{n}");
  });
});
