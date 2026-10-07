import type { LeadCaptureText, MessengerFacts, MessengerKind, MessengerVariant } from "@evinvest/kitstart";
import type { MessengerCopy } from "@/entities/content";
import { AFTER_PHONE, type Look } from "./look";

/** What a `lead_channel` arm changes on the card: the words over the kit's, the parts' look, and the lede. */
export interface MessengerShape {
  text: Partial<LeadCaptureText>;
  look: Look;
  /** The lede under the title; `null`: none — the arm draws its own there (VF-5's chip). */
  lede: string | null;
}

/**
 * The frame's buttons inside an arm (kitstart's messenger links and squares
 * take no class of their own): 52 px, rounded-xl, 16/24 bold, as the card's submit —
 * not the kit's text links (`variant="link"`: «Autre canal», «Copier le message»).
 */
const BUTTONS =
  "[&_[data-slot=button]:not(.underline-offset-4)]:min-h-[52px] [&_[data-slot=button]:not(.underline-offset-4)]:rounded-xl [&_[data-slot=button]:not(.underline-offset-4)]:text-base [&_[data-slot=button]:not(.underline-offset-4)]:leading-6 [&_[data-slot=button]:not(.underline-offset-4)]:font-bold [&_[data-slot=button]:not(.underline-offset-4)]:shadow-sm";

/** {@link BUTTONS} for VF-4's one button, the drawer's trigger — written out whole, for Tailwind to see. */
const TRIGGER =
  "[&_[data-slot=drawer-trigger]]:min-h-[52px] [&_[data-slot=drawer-trigger]]:rounded-xl [&_[data-slot=drawer-trigger]]:text-base [&_[data-slot=drawer-trigger]]:leading-6 [&_[data-slot=drawer-trigger]]:font-bold [&_[data-slot=drawer-trigger]]:shadow-sm";

/**
 * The message ready (and the bot's card): the frame's 72 px box in the leaf
 * tint, the title 14/18 semibold forest over two lines of 12/16.
 */
const PREVIEW =
  "items-center gap-3 rounded-xl bg-hover px-3 py-2.5 [&>div>p:first-child]:text-sm [&>div>p:first-child]:leading-[18px] [&>div>p:first-child]:font-semibold [&>div>p:first-child]:text-brand [&>div>p:last-child]:text-xs [&>div>p:last-child]:leading-4";

/** A channel in a menu (VF-1's select, VF-5's chip): its name 14/20 over its line in 12/16. */
const MENU_OPTION = "py-2 [&_span.flex-col>span:first-child]:text-sm [&_span.flex-col>span:last-child]:text-xs";

/** VF-2's tiles: the card's estimate tiles, 42 px, the chosen one gold at 10 % with a 2 px gold edge. */
const TILE =
  "h-[42px] gap-1.5 rounded-xl border-input bg-background px-2 text-sm leading-5 text-slate-700 shadow-none data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:font-semibold data-[state=on]:text-brand data-[state=on]:shadow-[inset_0_0_0_1px_var(--primary)]";

/**
 * Parts every arm shares. The slot is the frame's 72 px for each of its
 * states — `min-h`, not `h`: the QR code a computer draws in it is taller,
 * and the frame lets the card grow there (VF-3 on a computer, 808 px).
 * The channel row under the form goes: every arm offers the call itself.
 */
const BASE: Look = {
  // One column at every width: the postcode is the arm's only field beside it, and spans the card (VF-3 on a computer).
  contact: "grid gap-3",
  // `min-w-0`: a grid item of the contact block, which a button's unbroken label would widen past the card.
  messenger: `min-w-0 gap-3 ${BUTTONS}`,
  messengerSlot: "min-h-[72px]",
  messengerPreview: PREVIEW,
  messengerOption: MENU_OPTION,
  messengerSquare: "size-[52px] rounded-xl border-input",
  messengerHint: `vf-shield-before ${AFTER_PHONE}`,
  messengerReturn: "gap-3 rounded-2xl px-7",
  others: "hidden",
};

const LOOKS: Readonly<Record<MessengerKind, Look>> = {
  // VF-1: the select inside the phone's box, one 50 px field; the input loses its own frame.
  select: {
    messengerPicker:
      "h-[50px] rounded-xl border-input bg-background shadow-none [&_input]:h-full [&_input]:rounded-none [&_input]:border-0 [&_input]:shadow-none [&_input]:focus-visible:ring-0 has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-ring",
  },
  // VF-2: "Recevoir mon devis par" 14/20 semibold forest, the tiles in a row.
  tiles: {
    messenger: `min-w-0 gap-3 ${BUTTONS} [&>p:first-child]:-mb-1.5 [&>p:first-child]:font-semibold [&>p:first-child]:text-brand`,
    messengerPicker: "gap-1.5",
    messengerOption: TILE,
  },
  // VF-3: slot A is a button (52) or the phone (50), not the preview's 72.
  swap: { messengerSlot: "min-h-[52px]" },
  // VF-4: the card's one button is the drawer's trigger (its slot says so, not `button`);
  // the drawer's channels as cards, the recommended one gold at 10 %.
  sheet: {
    messenger: `min-w-0 gap-3 ${TRIGGER}`,
    // The drawer is portalled out of the card: its call button takes the card's look here.
    messengerPicker: `gap-3 px-5 pt-2 pb-6 [&_h2]:text-2xl [&_h2]:leading-8 [&_h2]:text-brand ${BUTTONS}`,
    messengerOption: "gap-3 rounded-xl p-4 [&.border-primary]:border-2 [&.border-primary]:bg-primary/10 [&:not(.border-primary)]:border-input",
  },
  // VF-5: the chip 8 px under the title (the card's rows are 20 apart), in the leaf tint.
  chip: {
    messengerPicker: "-mt-3 h-8 gap-1.5 bg-hover px-3 text-sm leading-5 font-semibold text-brand",
  },
  split: {},
  // Not aquafix's arms: never drawn here (`MESSENGER_ARMS`).
  segment: {},
  thanks: {},
  saga: {},
  urgency: {},
};

/**
 * No WhatsApp on the place, a bot: the control, «ou via Telegram» under its
 * submit — 14/20 semibold in leaf (Figma "Lead form A/B", the fallback "switched off in the panel").
 */
const FALLBACK: Look = {
  trust:
    "w-full gap-3 [&_a[data-intent=telegram]]:min-h-0 [&_a[data-intent=telegram]]:text-sm [&_a[data-intent=telegram]]:leading-5 [&_a[data-intent=telegram]]:font-semibold [&_a[data-intent=telegram]]:text-primary-ink",
};

/**
 * The arm's words, look and lede. Only a place with WhatsApp draws the arm —
 * kitstart's own rule (`messengerShownOf`) — so only then are the arm's words
 * laid over the card's: without it the card is the control, and VF-3's call
 * button must not rename the control's "Réserver".
 */
export function messengerShape(variant: MessengerVariant, facts: MessengerFacts, copy: MessengerCopy, lede: string): MessengerShape {
  if (facts.whatsapp === null) return { text: copy.words, look: FALLBACK, lede };
  const look = { ...BASE, ...LOOKS[variant.kind] };
  switch (variant.kind) {
    case "swap":
      // The call's submit is the card's own: its words for both flows.
      return { text: { ...copy.words, submit: copy.callNow, bookSubmit: copy.callNow }, look, lede: copy.swapLede };
    case "sheet":
      return { text: { ...copy.words, ...copy.sheet, messengerCallback: copy.callNow }, look, lede };
    case "chip":
      return { text: copy.words, look, lede: null };
    default:
      return { text: copy.words, look, lede };
  }
}
