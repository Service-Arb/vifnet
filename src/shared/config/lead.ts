import { validateLead, type LeadSchema } from "@evinvest/kitstart";

/**
 * The jobs the quote form offers — the four service cards of the Figma frame,
 * and the values the form posts and the lead store keeps.
 */
export const SUBJECTS = ["standard", "deep", "move", "post-construction"] as const;
export type Subject = (typeof SUBJECTS)[number];

/** The frame's featured service: the forest card on the home page, the "Most popular" row of the price table. */
export const FEATURED: Subject = "deep";

/** The size of the home: an optional question after the phone. */
export const BEDROOMS = ["studio", "1", "2", "3", "4", "5+"] as const;
export type Bedrooms = (typeof BEDROOMS)[number];

/** The extra fields the form posts beyond the core three, each capped at `max` characters. */
export const EXTRAS = { name: { name: "name", max: 100 }, bedrooms: { name: "bedrooms", max: 3 } } as const;

/**
 * What the quote form posts — service, ZIP (the locality) and phone, then an
 * optional name and bedrooms — and what is refused: a number we cannot call
 * (kitstart's `validateLead`, the rule the form itself blocks on, so the
 * server never refuses what the form let through) and a bedrooms value the
 * form never offers. The name is not checked: the call back asks it, and
 * nothing downstream needs it, while every required field costs leads. The
 * refused field goes back to the card; `why` is for the log only.
 */
export const LEAD: LeadSchema<Subject> = {
  subjects: SUBJECTS,
  wire: { subject: "subject", locality: "locality", mobile: "mobile" },
  extras: [EXTRAS.name, EXTRAS.bedrooms],
  // One spelling per number (`+33612345678`), so the panel and a person
  // searching the leads file find a customer however they typed it.
  mobileFormat: "e164",
  validate: lead => {
    const phone = validateLead(lead);
    if (phone) return phone;
    const bedrooms = lead.extras[EXTRAS.bedrooms.name];
    if (bedrooms !== undefined && bedrooms !== "" && !(BEDROOMS as readonly string[]).includes(bedrooms)) {
      return { field: EXTRAS.bedrooms.name, why: "bedrooms out of range" };
    }
    return null;
  },
};
