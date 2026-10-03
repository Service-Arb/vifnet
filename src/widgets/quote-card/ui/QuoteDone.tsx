import { Icon } from "@/shared/ui/Icon";

/** The card's words once a lead is taken: plain strings, they cross into the client island. */
export interface QuoteDoneText {
  /** `{first}`: the first word of the name. */
  title: string;
  titleNoName: string;
  /** Around the number as typed. */
  body: readonly [string, string];
}

/**
 * The card's last state (Figma QuoteCard Done): a leaf check, the first name
 * when one was given, and the number we will call. `LeadCapture` puts it in
 * the card's place and gives it the focus and `role="status"`.
 */
export function QuoteDone({ text, name, phone }: { text: QuoteDoneText; name: string | null; phone: string }) {
  const first = name?.trim().split(/\s+/)[0];
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-positive text-white">
        <Icon name="check" className="size-5" />
      </span>
      <p className="mt-3 font-display text-xl leading-7 font-bold text-brand">{first ? text.title.replace("{first}", first) : text.titleNoName}</p>
      <p className="mt-1 text-sm leading-5 text-ink-soft">
        {text.body[0]}
        <span className="font-bold text-brand">{phone}</span>
        {text.body[1]}
      </p>
    </div>
  );
}
