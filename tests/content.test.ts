import { describe, expect, it } from "vitest";
import { copyFor, REVIEWS, TEXT, type Facts } from "@/entities/content";
import { COPY_TODO } from "@/shared/config/copy-todo";
import { i18n, type Locale } from "@/shared/config/i18n";
import { SUBJECTS } from "@/shared/config/lead";
import { OWNER_TODO, site } from "@/shared/config/site";

// Completeness is the compiler's: `FR` and `EN` satisfy one `Text`. What the
// type cannot see is an empty string, a sentence that states a term the owner
// has not confirmed, or a fact written by hand. The Figma frame's own words are
// on the page verbatim; OWNER_TODO "design sample content" holds the launch.

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

/** The wording the design proposed for each unconfirmed term: each must trip its own pattern. */
const PROPOSED: Record<Locale, Readonly<Record<string, string>>> = {
  fr: {
    "fixed price": "Prix confirmé avant l’intervention — il ne change pas sur place",
    offices: "Le ménage fait à fond, chez vous et dans vos locaux.",
    consent: "rien n’est facturé sans votre accord",
    "no retouching": "Des interventions réelles, sans retouche.",
    "joint check": "Vous vérifiez le résultat avec l’équipe avant son départ.",
    "no sales calls": "Pas de démarchage.",
  },
  en: {
    "fixed price": "The price is confirmed in writing and does not change",
    offices: "Cleaning for homes and premises",
    consent: "nothing is charged without your consent",
    "no retouching": "Real jobs, no retouching.",
    "joint check": "You check the result with the team before it leaves.",
    "no sales calls": "No sales calls.",
  },
};

describe("the copy", () => {
  it.each(i18n.locales)("has no empty string (%s)", locale => {
    expect(copyOf(locale).filter(([, s]) => s.trim() === "")).toEqual([]);
  });

  it("has the same shape in both languages", () => {
    expect(copyOf("en").map(([p]) => p)).toEqual(copyOf("fr").map(([p]) => p));
  });

  // One pattern per `copy:` line of OWNER_TODO, in each language: confirming a
  // term is deleting its line, which is what lets the copy say it.
  it.each(i18n.locales)("states no term the owner has not confirmed (%s)", locale => {
    const said = COPY_TODO.flatMap(todo =>
      copyOf(locale)
        .filter(([, s]) => todo.said[locale].test(s))
        .map(([path, s]) => `${todo.field} @ ${path}: ${s}`),
    );
    expect(said).toEqual([]);
  });

  it("lists every unconfirmed term for the owner", () => {
    const copyLines = OWNER_TODO.filter(t => t.field.startsWith("copy: ")).map(t => t.field);
    expect(copyLines).toEqual(COPY_TODO.map(t => t.field));
    expect(Object.keys(PROPOSED.fr).map(f => `copy: ${f}`).sort()).toEqual([...copyLines].sort());
  });

  it.each(i18n.locales)("catches the wording the design proposed (%s)", locale => {
    const missed = COPY_TODO.filter(todo => {
      const line = PROPOSED[locale][todo.field.replace(/^copy: /, "")];
      return line === undefined || !todo.said[locale].test(line);
    }).map(t => t.field);
    expect(missed).toEqual([]);
  });

  it.each(i18n.locales)("writes no phone number by hand (%s)", locale => {
    // The frame's sample number lives in `shared/config/sample`, not in the copy.
    const numbers = copyOf(locale).filter(([, s]) => /(\+33|\b0[1-9])[\d\s.]{8,}|\(\d{3}\)\s?\d{3}-\d{4}/.test(s));
    expect(numbers).toEqual([]);
  });

  it.each(i18n.locales)("names no street, map or premises to visit (%s)", locale => {
    const said = copyOf(locale).filter(([, s]) => /\b(rue|avenue|boulevard|street|google maps|itinéraire|directions)\b/i.test(s));
    expect(said).toEqual([]);
  });

  it.each(i18n.locales)("words every service card and every review of the frame (%s)", locale => {
    const { t } = copyFor(locale, facts());
    for (const subject of SUBJECTS) expect(t.services.items[subject].points, subject).toHaveLength(5);
    for (const key of REVIEWS) expect(t.reviews.items[key].quote, key).not.toBe("");
    expect(t.stats).toHaveLength(4);
    expect(t.quote.doneTitle).toContain("{first}");
  });

  it("sets French typography: no straight quote, a no-break space before ? ! : ;", () => {
    const said = copyOf("fr").filter(([, s]) => /['"]|[^\u00a0][?!:;](\s|$)/.test(s));
    expect(said).toEqual([]);
  });
});
