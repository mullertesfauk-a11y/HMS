"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/dialog";
import {
  completeOrder,
  cancelOrder,
} from "@/app/(admin)/admin/(protected)/orders/actions";

/**
 * State-based action buttons for the order detail page. Server actions
 * perform the transition (permission + state machine + audit).
 */
export function OrderActions({ orderId, status }: { orderId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  function run(action: () => Promise<{ ok?: true; error?: string }>, label: string) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        return;
      }
      setNotice(label);
    });
  }

  const isOpen = status === "PLACED";

  return (
    <div className="space-y-2">
      {isOpen ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            loading={pending}
            onClick={() => run(() => completeOrder(orderId), "Marked completed")}
          >
            <CheckCircle2 aria-hidden className="h-4 w-4" />
            Mark completed
          </Button>
          <Button
            size="sm"
            variant="dangerGhost"
            loading={pending}
            onClick={() => setConfirmCancelOpen(true)}
          >
            <XCircle aria-hidden className="h-4 w-4" />
            Cancel order
          </Button>
        </div>
      ) : (
        <p className="text-sm text-stone-500">
          This order is {status === "COMPLETED" ? "completed" : "cancelled"} and
          can no longer be changed.
        </p>
      )}

      {notice ? (
        <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {notice}.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <ConfirmationDialog
        open={confirmCancelOpen}
        onOpenChange={setConfirmCancelOpen}
        title="Cancel this order?"
        description="The kitchen will not prepare this order. This action cannot be undone."
        confirmLabel="Cancel order"
        destructive
        loading={pending}
        onConfirm={() => {
          setConfirmCancelOpen(false);
          run(() => cancelOrder(orderId), "Order cancelled");
        }}
      />
    </div>
  );
}
