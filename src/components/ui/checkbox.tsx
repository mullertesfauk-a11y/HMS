import * as React from "react";

import { cn } from "@/lib/utils/cn";

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const checkboxId = id ?? props.name;
    return (
      <label htmlFor={checkboxId} className="inline-flex items-center gap-2">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className={cn(
            "h-4 w-4 rounded border-stone-300 accent-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
            className,
          )}
          {...props}
        />
        {label ? <span className="text-sm text-stone-700">{label}</span> : null}
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";
