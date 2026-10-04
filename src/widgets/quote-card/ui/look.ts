import type { LeadCapturePart } from "@evinvest/kitstart/react";

/**
 * The frame's Field (6:26) over the kit's controls: slate-200 border
 * (`border-input`), rounded-xl, 16 × 14, 14/20 — placeholder slate-400, value
 * slate-700 — and a 2 px leaf ring on focus. Shared by the inputs and both
 * states of the selects, so a select is the same box before and after it
 * hydrates. `LeadCapture` gives it to the need's select and the callback's
 * phone too (`control`); the bedrooms select takes it itself.
 */
export const FIELD =
  "h-[50px] rounded-xl bg-background py-3.5 text-sm leading-5 text-slate-700 shadow-none md:text-sm placeholder:text-slate-400 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring";

/** The frame's full-width gold buttons: Button lg at 16 px padding, with shadow-sm. */
export const WIDE_BUTTON = "w-full py-4 leading-6 font-bold shadow-sm hover:bg-amber-400";

/** The frame's 11 px grey under the submit: the trust line and the privacy note. */
export const FINE_PRINT = "text-center text-[11px] leading-[16.5px] text-slate-400";

/**
 * A field in the contact step pairs with its neighbour when two fit (2 × 12rem
 * and the gap: the desktop card, not the 302 px phone one) and takes the row
 * alone otherwise. `basis-48` beats Field's own `w-full` on the row axis; in a
 * column it would be a 192 px height, which is why every other container a
 * kit Field sits in (the form, the callback's form) is a grid.
 */
export const PAIRED_FIELD = "min-w-0 grow basis-48";

/**
 * "Call me back" folded to one quiet text line under the form: the frame's
 * card has no callback, and a full-width outline button under the gold one
 * would be a second call to action. Open, its form wears the card's Field
 * and gold button.
 */
const CALLBACK_LINK =
  "h-auto min-h-0 justify-center border-0 bg-transparent p-0 text-sm leading-5 font-semibold text-brand underline underline-offset-4 shadow-none hover:bg-transparent hover:no-underline";

/**
 * `LeadCapture`'s parts in the frame's QuoteCard: its 20 px between the head
 * and the form and 12 px between fields, the Field box, the gold submit at the
 * frame's Button lg (`size="xl"`'s padding and text, which `touch` lacks),
 * the contact step's fields two to a row where they fit. The labels are the kit's, `sr-only` under `labels="hidden"`: the frame
 * draws placeholders.
 */
export const LEAD_CAPTURE_LOOK: Readonly<Partial<Record<LeadCapturePart, string>>> = {
  root: "gap-5",
  // A grid, not the kit's column: the need's Field shares `field` with the
  // contact step's, and its `basis-48` must not become a height here.
  form: "grid gap-3",
  // Fields pair on a row (`field`); everything else in the step takes one.
  contact: "flex-row flex-wrap gap-3",
  field: PAIRED_FIELD,
  error: "w-full",
  opening: "w-full",
  trust: "w-full gap-3",
  control: `${FIELD} px-4`,
  // qualify-first's tiles: the Field's box and type, so both arms read alike.
  need: "rounded-xl py-3.5 text-sm leading-5 text-slate-700",
  summary: "text-sm leading-5",
  submit: `${WIDE_BUTTON} px-(--control-px) text-(length:--control-text)`,
  privacy: `w-full ${FINE_PRINT}`,
  // "Ou contactez-nous · Rappelez-moi" on one line; open, the callback takes
  // a line of its own (`open:basis-full`).
  others: "flex-row flex-wrap items-baseline justify-center gap-x-2 gap-y-3 text-center",
  channel: "rounded-xl font-semibold",
  callback: "w-auto open:basis-full",
  callbackSummary: CALLBACK_LINK,
  // A grid for the phone's Field, as `form`.
  callbackForm: "mt-3 grid gap-3 text-left",
  callbackLede: "text-sm leading-5",
  callbackSubmit: `${WIDE_BUTTON} px-(--control-px) text-(length:--control-text)`,
  consent: "text-sm leading-5",
  // The estimate (Figma 60:3497, Option A): its answers are the qualify-first
  // tiles — the Field's radius, border and type, the kit's gold check — at one
  // line's height, so a two-line label ("Toutes les 2 semaines") fits the same
  // 44 px tile (40 on desktop; the phone keeps the kit's 44 px touch target).
  // The price is a quiet card-coloured box: the title and the total, in the
  // display face, on one line, the breakdown in two columns from `sm`.
  estimate: "w-full gap-3",
  estimateLegend: "mb-1 text-sm leading-5 font-semibold text-brand",
  estimateOption: "justify-center rounded-xl px-3 py-1 text-center text-sm leading-4 text-slate-700 md:min-h-10",
  price: "w-full flex-row flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-xl border-input px-4 py-3",
  priceTotal: "text-3xl leading-9 text-brand",
  breakdown: "w-full leading-5 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-0",
  // 16 px, not the fine print's 16.5: one odd half pixel put every band under the hero off the pixel grid.
  priceNote: "w-full text-[11px] leading-4 text-slate-400",
  photos: "w-full rounded-xl border-input",
  // After a priced lead: under the Done check, centred like it.
  priced: "-mt-2 items-center gap-1 pb-6 text-center",
  pricedPrice: "text-base leading-6 font-semibold text-brand",
  pricedNote: "text-sm leading-5 text-ink-soft",
};
