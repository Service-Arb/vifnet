import { Icon } from "@/shared/ui/Icon";

/** The card's last state (Figma QuoteCard Done): a leaf check, the first name, and the number we will call. */
export function QuoteDone({ title, body, phone }: { title: string; body: readonly [string, string]; phone: string }) {
  return (
    <div role="status" className="flex flex-col items-center py-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-positive text-white">
        <Icon name="check" className="size-5" />
      </span>
      <p className="mt-3 font-display text-xl leading-7 font-bold text-brand">{title}</p>
      <p className="mt-1 text-sm leading-5 text-ink-soft">
        {body[0]}
        <span className="font-bold text-brand">{phone}</span>
        {body[1]}
      </p>
    </div>
  );
}
