import { Icon } from "../Icon";

const SIZE = {
  /** The header's (Figma Logo md). */
  md: { mark: "size-8 rounded-lg", icon: "size-4", gap: "gap-2.5", word: "text-xl leading-7 tracking-[-0.5px]" },
  /** The footer's (Figma Logo sm). */
  sm: { mark: "size-6 rounded-md", icon: "size-3", gap: "gap-2", word: "text-sm leading-5" },
} as const;

/**
 * The frame's logo (Figma 5:66): a gold square with the house, and the word.
 * The word takes the scope's ink — white in a dark band, as drawn.
 */
export function Logo({ size = "md", className = "" }: { size?: keyof typeof SIZE; className?: string }) {
  const s = SIZE[size];
  return (
    <span className={`flex items-center ${s.gap} ${className}`}>
      <span className={`flex items-center justify-center bg-primary text-brand ${s.mark}`}>
        <Icon name={size === "md" ? "home" : "home-outline"} className={s.icon} />
      </span>
      <span className={`font-sans font-bold whitespace-nowrap text-ink ${s.word}`}>Vifnet</span>
    </span>
  );
}
