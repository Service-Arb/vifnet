import type { ExperimentConfig } from "@evinvest/experiments";
import type { BookingProvider } from "@evinvest/kitstart";
import type { LeadCaptureLayout } from "@evinvest/kitstart/react";

/**
 * The A/B tests running on the home page (docs/EXPERIMENTS.md). `variants[0]`
 * is the control: the Figma frame as it stands. `enabled: false` is the kill
 * switch — everyone, cookie or not, gets the control on the next render.
 *
 * Keys and variants end up in an internal path segment (`lib/experiments`),
 * so they stay `[a-z0-9_]`.
 */
export const EXPERIMENTS = {
  /**
   * kitstart's `LeadCapture` layout, the same key and arms as aquafix's so the
   * two sites' results pool: a, everything on one screen; b, the service
   * first, then the contact.
   */
  lead_layout: { variants: ["a", "b"], weights: [0.5, 0.5], enabled: true },
  /**
   * How a priced lead sets its slot: a, the call (`manual`); b, the place's
   * Google appointment schedule. kitstart's key (`BOOKING_EXPERIMENT`), the
   * same on every brand so the arms pool. Inert until the panel gives the
   * place a schedule: without one, kitstart offers b the call too.
   */
  booking_provider: { variants: ["a", "b"], weights: [0.5, 0.5], enabled: true },
} as const satisfies ExperimentConfig;

export type ExperimentKey = keyof typeof EXPERIMENTS;
export type VariantOf<K extends ExperimentKey> = (typeof EXPERIMENTS)[K]["variants"][number];

/** `lead_layout`'s arms as `LeadCapture` names them. */
export const LEAD_LAYOUTS = { a: "single", b: "qualify-first" } as const satisfies Record<VariantOf<"lead_layout">, LeadCaptureLayout>;

/** `booking_provider`'s arms as kitstart's `bookingOf` names the providers. */
export const BOOKING_ARMS = { a: "manual", b: "google_calendar" } as const satisfies Record<VariantOf<"booking_provider">, BookingProvider>;

/** `?ab_<key>=<variant>` forces a variant (QA); the same prefix as the cookie. */
export const FORCE_PARAM = "ab_";

/**
 * Set on a forced visit, for as long as the assignment: every event from that
 * browser says `forced: true` and the report leaves it out. Not `ab_<key>`
 * shaped on purpose — no experiment may be called `qa_`.
 */
export const QA_COOKIE = "ab__qa";

/** The four events every Service-Arb landing sends for its experiments (aquafix too). */
export const EXPERIMENT_EVENTS = {
  exposed: "experiment_exposed",
  contact: "experiment_contact",
  step: "experiment_step",
  lead: "experiment_lead",
} as const;

/** Everything an experiment event may carry; the sink drops (dev: throws on) the rest. */
export const EXPERIMENT_PROPS = ["brand_id", "location_id", "experiment", "variant", "channel", "forced", "step"] as const;
