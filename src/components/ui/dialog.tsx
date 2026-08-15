"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  /** Footer content (usually action buttons). */
  footer?: React.ReactNode;
}

/**
 * Accessible modal dialog backed by the native <dialog> element (focus trap,
 * Escape-to-close and scroll blocking come from the browser).
 */
export function Dialog({ open, onOpenChange, title, description, children, footer }: DialogProps) {
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

  return (
    <dialog
      ref={ref}
      onClose={() => onOpenChange(false)}
      onClick={(event) => {
        // Click on the backdrop closes the dialog.
        if (event.target === ref.current) onOpenChange(false);
      }}
      className="m-auto w-full max-w-md rounded-lg border border-stone-200 bg-white p-0 shadow-xl backdrop:bg-black/40 open:flex open:flex-col"
    >
      <div className="flex items-start justify-between border-b border-stone-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-stone-500">{description}</p> : null}
        </div>
        <button
          type="button"
          aria-label="Close dialog"
          onClick={() => onOpenChange(false)}
          className="rounded p-1 text-stone-500 hover:bg-stone-100 hover:text-foreground"
        >
          ✕
        </button>
      </div>
      <div className={cn("px-5 py-4")}>{children}</div>
      {footer ? (
        <div className="flex justify-end gap-2 border-t border-stone-100 px-5 py-4">{footer}</div>
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
