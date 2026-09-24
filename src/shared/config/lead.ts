import type { LeadSchema } from "@evinvest/kitstart";

/**
 * The kinds of job the quote form offers — the values it posts and the lead
 * store keeps. Only what the portfolio in `assets/profile_images/` shows;
 * routine cleaning, end of tenancy and after-works cleaning wait for the owner
 * (`OWNER_TODO`).
 */
export const SUBJECTS = ["deep", "upholstery", "exterior", "other"] as const;
export type Subject = (typeof SUBJECTS)[number];

/** Whole square metres: a quote for a studio and one for a hotel floor differ by the surface. */
export const SURFACE_M2 = { name: "surface_m2", min: 1, max: 100_000 } as const;

/**
 * What the quote form asks, and the rules worth enforcing: a lead with no way
 * to reach the customer is not a lead, and a surface is a whole number when
 * given. The reason is for the log only.
 */
export const LEAD: LeadSchema<Subject> = {
  subjects: SUBJECTS,
  wire: { subject: "subject", locality: "locality", mobile: "mobile" },
  extras: [{ name: SURFACE_M2.name, max: String(SURFACE_M2.max).length }],
  validate: lead => {
    if (lead.mobile.replace(/\D/g, "").length < 10) return "a mobile number";
    const raw = lead.extras[SURFACE_M2.name];
    if (raw === undefined || raw === "") return null;
    if (!/^\d+$/.test(raw)) return `${SURFACE_M2.name} must be a whole number`;
    const m2 = Number(raw);
    return m2 >= SURFACE_M2.min && m2 <= SURFACE_M2.max ? null : `${SURFACE_M2.name} out of range`;
  },
};
