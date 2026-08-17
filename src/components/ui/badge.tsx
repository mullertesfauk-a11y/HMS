import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-stone-100 text-stone-700 border border-stone-200",
        brand: "bg-brand-light text-brand-dark border border-brand/20",
        amber: "bg-amber-50 text-amber-800 border border-amber-200",
        blue: "bg-blue-50 text-blue-800 border border-blue-100",
        green: "bg-emerald-50 text-emerald-800 border border-emerald-100",
        red: "bg-red-50 text-red-800 border border-red-100",
        violet: "bg-violet-50 text-violet-800 border border-violet-100",
        stone: "bg-stone-100 text-stone-600 border border-stone-200",
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
