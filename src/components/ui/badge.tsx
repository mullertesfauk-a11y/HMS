import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-0.5 text-xs font-medium tracking-wide uppercase",
  {
    variants: {
      variant: {
        neutral: "bg-stone-100 text-stone-700",
        brand: "bg-brand-light text-brand-dark border border-brand/20",
        amber: "bg-amber-50 text-amber-800 border border-amber-200",
        blue: "bg-blue-50 text-blue-800",
        green: "bg-emerald-50 text-emerald-800",
        red: "bg-red-50 text-red-800",
        violet: "bg-violet-50 text-violet-800",
        stone: "bg-stone-100 text-stone-600",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: React.ReactNode;
}

export function Badge({ className, variant, icon, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {icon ? <span aria-hidden>{icon}</span> : null}
      {children}
    </span>
  );
}
