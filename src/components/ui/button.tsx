import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-[#17211b] text-white hover:bg-[#26352b]",
  secondary: "border border-[#cfd8d1] bg-white text-[#17211b] hover:bg-[#f6f7f4]",
  ghost: "text-[#516156] hover:bg-[#eef0ed] hover:text-[#17211b]",
};

export function ButtonLink({
  className,
  variant = "ghost",
  children,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; children: ReactNode }) {
  return (
    <Link
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors",
        variantClass[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
