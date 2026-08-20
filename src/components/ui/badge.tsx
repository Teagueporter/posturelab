import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "default" | "muted" | "success" | "warning" | "danger";

const toneClass: Record<BadgeTone, string> = {
  default: "border-[#cfd8d1] bg-white text-[#17211b]",
  muted: "border-[#d8ded7] bg-[#f6f7f4] text-[#516156]",
  success: "border-[#cde4d4] bg-[#edf4ef] text-[#237a57]",
  warning: "border-[#f0dfaa] bg-[#fff4d8] text-[#8a6416]",
  danger: "border-[#eacbc0] bg-[#faeee9] text-[#a74731]",
};

export function Badge({
  className,
  tone = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-1 text-xs font-semibold leading-none",
        toneClass[tone],
        className,
      )}
      {...props}
    />
  );
}
