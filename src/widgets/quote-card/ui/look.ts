/**
 * The frame's Field (6:26) over the kit's controls: slate-200 border
 * (`border-input`), rounded-xl, 16 × 14, 14/20 — placeholder slate-400, value
 * slate-700 — and a 2 px leaf ring on focus. Shared by the inputs and both
 * states of the selects, so a select is the same box before and after it
 * hydrates.
 */
export const FIELD =
  "h-[50px] rounded-xl bg-background py-3.5 text-sm leading-5 text-slate-700 shadow-none md:text-sm placeholder:text-slate-400 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring";

/** The frame's full-width gold buttons: Button lg at 16 px padding, with shadow-sm. */
export const WIDE_BUTTON = "w-full py-4 leading-6 font-bold shadow-sm hover:bg-amber-400";
