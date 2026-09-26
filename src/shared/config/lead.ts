import type { LeadSchema } from "@evinvest/kitstart";

/**
 * The jobs the quote form offers — the four service cards of the Figma frame,
 * and the values the form posts and the lead store keeps.
 */
export const SUBJECTS = ["standard", "deep", "move", "post-construction"] as const;
export type Subject = (typeof SUBJECTS)[number];

/** The size of the home, as the frame's second step asks it. */
export const BEDROOMS = ["studio", "1", "2", "3", "4", "5+"] as const;
export type Bedrooms = (typeof BEDROOMS)[number];

/** The frame's defaults for the second step: "3 bedrooms", "Standard Clean". */
export const DEFAULTS = { bedrooms: "3", subject: "standard" } as const satisfies { bedrooms: Bedrooms; subject: Subject };

/** The extra fields the form posts beyond the core three, each capped at `max` characters. */
export const EXTRAS = { name: { name: "name", max: 100 }, bedrooms: { name: "bedrooms", max: 3 } } as const;

/**
 * What the quote form asks — name, phone and ZIP, then bedrooms and service —
 * and the rules worth enforcing: a lead with no way to reach the customer or
 * no one to ask for is not a lead. ZIP is the locality. The reason is for the
 * log only.
 */
export const LEAD: LeadSchema<Subject> = {
  subjects: SUBJECTS,
  wire: { subject: "subject", locality: "locality", mobile: "mobile" },
  extras: [EXTRAS.name, EXTRAS.bedrooms],
  validate: lead => {
    if (lead.mobile.replace(/\D/g, "").length < 10) return "a mobile number";
    if ((lead.extras[EXTRAS.name.name] ?? "").trim() === "") return "a name";
    const bedrooms = lead.extras[EXTRAS.bedrooms.name];
    if (bedrooms !== undefined && bedrooms !== "" && !(BEDROOMS as readonly string[]).includes(bedrooms)) return "bedrooms out of range";
    return null;
  },
};
