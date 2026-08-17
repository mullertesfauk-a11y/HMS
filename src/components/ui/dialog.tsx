"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  /** Footer content (usually action buttons). */
  footer?: React.ReactNode;
  /** Width size preset. Defaults to "xl" for spacious, non-cramped dialogs. */
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
  className?: string;
}

const sizeWidths: Record<string, number> = {
  sm: 440,
  md: 540,
  lg: 680,
  xl: 820,
  "2xl": 960,
  "3xl": 1100,
  "4xl": 1240,
};

/**
 * Accessible modal dialog backed by the native <dialog> element (focus trap,
 * Escape-to-close and scroll blocking come from the browser).
 */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "3xl",
  className,
}: DialogProps) {
  const ref = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const targetWidth = sizeWidths[size] ?? 1100;

  return (
    <dialog
      ref={ref}
      onClose={() => onOpenChange(false)}
      onClick={(event) => {
        // Click on the backdrop closes the dialog.
        if (event.target === ref.current) onOpenChange(false);
      }}
      style={{
        width: `min(94vw, ${targetWidth}px)`,
        maxWidth: `${targetWidth}px`,
      }}
      className={cn(
        "fixed inset-0 m-auto rounded-xl border border-border bg-white p-0 shadow-2xl backdrop:bg-slate-950/60 backdrop:backdrop-blur-xs open:flex open:flex-col overflow-hidden",
        className,
      )}
    >
      <div className="w-full flex items-start justify-between border-b border-border-subtle px-6 py-4.5 bg-white">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description ? <p className="mt-0.5 text-xs sm:text-sm text-stone-500">{description}</p> : null}
        </div>
        <button
          type="button"
          aria-label="Close dialog"
          onClick={() => onOpenChange(false)}
          className="rounded-md p-1.5 text-stone-400 hover:bg-stone-100 hover:text-foreground transition-colors"
        >
          ✕
        </button>
      </div>
      <div className="w-full px-6 py-5 overflow-y-auto max-h-[calc(85vh-8rem)]">{children}</div>
      {footer ? (
        <div className="w-full flex justify-end gap-2.5 border-t border-border-subtle bg-surface-subtle px-6 py-3.5 rounded-b-xl">{footer}</div>
      ) : null}
    </dialog>
  );
}

export function ConfirmationDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <Dialog
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={props.title}
      description={props.description}
      footer={
        <>
          <Button variant="secondary" onClick={() => props.onOpenChange(false)}>
            Keep it
          </Button>
          <Button
            variant={props.destructive ? "destructive" : "primary"}
            loading={props.loading}
            onClick={props.onConfirm}
          >
            {props.confirmLabel}
          </Button>
        </>
      }
    />
  );
}
