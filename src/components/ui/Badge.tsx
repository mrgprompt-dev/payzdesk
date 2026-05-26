import { cn } from "@/utils";
import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "gold" | "success" | "danger";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-card text-muted border border-border",
  gold: "bg-accent-gold/15 text-accent-gold",
  success: "bg-accent-green/15 text-accent-green",
  danger: "bg-destructive/15 text-destructive",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
