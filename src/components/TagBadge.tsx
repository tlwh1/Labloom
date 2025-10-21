import clsx from "clsx";
import { NoteTag } from "../types/note";

type TagBadgeProps = {
  tag: NoteTag;
  variant?: "solid" | "light";
};

export function TagBadge({ tag, variant = "solid" }: TagBadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
        variant === "solid"
          ? "bg-[var(--color-accent-muted)] text-slate-700 dark:text-slate-200 border-transparent"
          : "border-white/50 bg-white/30 text-white"
      )}
    >
      #{tag.label}
    </span>
  );
}
