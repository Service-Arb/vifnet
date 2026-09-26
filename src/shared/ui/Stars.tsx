import { Icon } from "./Icon";

/** Five gold stars, 14 px, 2 apart (Figma Stars 5:42). Decorative: the rating is written beside it. */
export function Stars({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`flex gap-0.5 text-accent-warn ${className}`}>
      {[0, 1, 2, 3, 4].map(i => (
        <Icon key={i} name="star" className="size-3.5" />
      ))}
    </span>
  );
}
