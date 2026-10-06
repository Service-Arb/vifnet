import type { ExperimentConfig, OverriddenConfig } from "@evinvest/experiments";
import type { BookingProvider } from "@evinvest/kitstart";
import type { AbSwitcherExperiment } from "@evinvest/kitstart/react";
import type { LeadForm } from "./lead";

/**
 * The A/B tests running on the home page (docs/EXPERIMENTS.md). `variants[0]`
 * is the control: the Figma frame as it stands. The weights and `enabled`
 * here are what the build declares to the panel; the panel's operator
 * overrides them without a deploy (`experimentOverrides`), so read a variant
 * through {@link LiveExperiments}, never this object. `enabled: false` is the
 * kill switch — everyone, cookie or not, gets the control on the next request.
 *
 * Keys and variants end up in an internal path segment (`lib/experiments`),
 * so they stay `[a-z0-9_]`.
 */
export const EXPERIMENTS = {
  /**
   * The lead form (Figma "Lead form A/B"): a, the compact card on one screen;
   * b, one question per screen; c, the price first. `a` and `b` are aquafix's
   * arms under the same key, so the two sites' results pool; `c` is this
   * brand's own.
   */
  lead_form: { variants: ["a", "b", "c"], weights: [1, 1, 1], enabled: true },
  /**
   * How a priced lead sets its slot: a, the call (`manual`); b, the place's
   * Google appointment schedule. kitstart's key (`BOOKING_EXPERIMENT`), the
   * same on every brand so the arms pool. Inert until the panel gives the
   * place a schedule: without one, kitstart offers b the call too.
   */
  booking_provider: { variants: ["a", "b"], weights: [0.5, 0.5], enabled: true },
} as const satisfies ExperimentConfig;

export type ExperimentKey = keyof typeof EXPERIMENTS;

/** {@link EXPERIMENTS} with the panel's overrides laid over it: the variants stay the code's. */
export type LiveExperiments = OverriddenConfig<typeof EXPERIMENTS>;

/**
 * Each experiment's hypothesis in one line (docs/EXPERIMENTS.md), declared to
 * the panel at start so its "Experiments" screen says what is being tested.
 * The panel refuses a summary over 200 characters (`tests/experiments.test.ts`).
 */
export const EXPERIMENT_SUMMARIES: Record<ExperimentKey, string> = {
  lead_form: "One question per screen (b), or the price of each frequency first with an \"I don't know\" way to a quote (c), lifts leads per visit over the compact one-screen form (a).",
  booking_provider: "After a priced lead, picking a slot on the owner's Google schedule books more slots than the promise of a call.",
};
export type VariantOf<K extends ExperimentKey> = (typeof EXPERIMENTS)[K]["variants"][number];

/** `lead_form`'s arms as the quote card's forms. */
export const LEAD_FORMS = { a: "compact", b: "steps", c: "price-first" } as const satisfies Record<VariantOf<"lead_form">, LeadForm>;

/** `booking_provider`'s arms as kitstart's `bookingOf` names the providers. */
export const BOOKING_ARMS = { a: "manual", b: "google_calendar" } as const satisfies Record<VariantOf<"booking_provider">, BookingProvider>;

/**
 * The QA menu's words (docs/EXPERIMENTS.md, "Forcing a variant"): every
 * experiment and every one of its variants, no more — a variant the code
 * drops or adds fails the type here, not on a tester's phone.
 */
const AB_SWITCHER_LABELS = {
  lead_form: { label: "Lead form", variants: { a: "Compact", b: "Steps", c: "Price first" } },
  booking_provider: { label: "Booking", variants: { a: "Call back", b: "Google Calendar" } },
} as const satisfies { [K in ExperimentKey]: { label: string; variants: Record<VariantOf<K>, string> } };

/**
 * {@link AB_SWITCHER_LABELS} as kitstart's `AbSwitcher` takes them. A function,
 * not a constant: this module is in the client bundle (`ExperimentScope`), and
 * a top-level `.map` would ship there although only the server layout reads it.
 */
export function abSwitcherExperiments(): AbSwitcherExperiment[] {
  return Object.entries(AB_SWITCHER_LABELS).map(([key, { label, variants }]) => ({
    key,
    label,
    variants: Object.entries(variants).map(([value, variantLabel]) => ({ value, label: variantLabel })),
  }));
}

/** `?ab_<key>=<variant>` forces a variant (QA); the same prefix as the cookie. */
export const FORCE_PARAM = "ab_";

/**
 * Set on a forced visit, for as long as the assignment: every event from that
 * browser says `forced: true`, and PostHog's funnel leaves it out. Not `ab_<key>`
 * shaped on purpose — no experiment may be called `qa_`.
 */
export const QA_COOKIE = "ab__qa";

/**
 * Set on a QA browser's home page only, for the session: the experiments the
 * live config has paused, comma-separated, so the QA menu can say "not
 * running" rather than show a stale arm. Dropped once none is paused.
 */
export const QA_PAUSED_COOKIE = "ab__qa_off";

/** The four events every Service-Arb landing sends for its experiments (aquafix too). */
export const EXPERIMENT_EVENTS = {
  exposed: "experiment_exposed",
  contact: "experiment_contact",
  step: "experiment_step",
  lead: "experiment_lead",
} as const;

/** Everything an experiment event may carry; the sink drops (dev: throws on) the rest. */
export const EXPERIMENT_PROPS = ["brand_id", "location_id", "experiment", "variant", "channel", "forced", "step"] as const;
