import type { LeadCapturePart } from "@evinvest/kitstart/react";

/**
 * The frame's Field (6:26) over the kit's controls: slate-200 border
 * (`border-input`), rounded-xl, 16 × 14, 14/20 — placeholder slate-400, value
 * slate-700 — and a 2 px leaf ring on focus. Shared by the inputs and both
 * states of the selects, so a select is the same box before and after it
 * hydrates. The need's select takes no class from us (`LeadCapture` passes it
 * none): `app/globals.css` gives it the same box.
 */
export const FIELD =
  "h-[50px] rounded-xl bg-background py-3.5 text-sm leading-5 text-slate-700 shadow-none md:text-sm placeholder:text-slate-400 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring";

/** The frame's full-width gold buttons: Button lg at 16 px padding, with shadow-sm. */
export const WIDE_BUTTON = "w-full py-4 leading-6 font-bold shadow-sm hover:bg-amber-400";

/**
 * A field's name above it. The frame draws placeholders only; `LeadCapture`
 * labels its fields instead, so the label is set small and quiet.
 */
export const LABEL = "text-xs leading-4 font-semibold text-ink-soft";

/** The frame's 11 px grey under the submit: the trust line and the privacy note. */
export const FINE_PRINT = "text-center text-[11px] leading-[16.5px] text-slate-400";

/**
 * `LeadCapture`'s parts in the frame's QuoteCard: its 20 px between the head
 * and the form and 12 px between fields, the Field box, the gold submit at the
 * frame's Button lg (`size="xl"`'s padding and text, which `touch` lacks).
 */
export const LEAD_CAPTURE_LOOK: Readonly<Partial<Record<LeadCapturePart, string>>> = {
  root: "gap-5",
  form: "gap-3",
  contact: "gap-3",
  trust: "gap-3",
  field: "gap-1.5",
  label: LABEL,
  control: `${FIELD} px-4`,
  // qualify-first's tiles: the Field's box and type, so both arms read alike.
  need: "rounded-xl py-3.5 text-sm leading-5 text-slate-700",
  summary: "text-sm leading-5",
  submit: `${WIDE_BUTTON} px-(--control-px) text-(length:--control-text)`,
  // 16 px, not the trust line's 16.5: a half-pixel card shifts every band
  // under the hero off the pixel grid, and each would rasterise anew.
  privacy: `${FINE_PRINT} leading-4`,
  others: "gap-2",
  channel: "rounded-xl font-semibold",
};
