import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "default" | "muted" | "success" | "warning" | "danger";

const toneClass: Record<BadgeTone, string> = {
  default: "border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground)]",
  muted: "border-[var(--border)] bg-[var(--surface-soft)] text-[var(--muted-strong)]",
  success: "border-[#cde4d4] bg-[var(--accent-soft)] text-[var(--accent)]",
  warning: "border-[#ecdca7] bg-[var(--warning-soft)] text-[var(--warning)]",
  danger: "border-[#e7c1b6] bg-[var(--danger-soft)] text-[var(--danger)]",
};

export function Badge({
  className,
  tone = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold leading-none",
        toneClass[tone],
        className,
      )}
      {...props}
    />
  );
}
