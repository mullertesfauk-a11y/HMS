"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/dialog";

/**
 * Button that runs a server action after an explicit confirmation. Used for
 * destructive or high-impact actions (delete room, disable staff, cancel).
 *
 * The server action must be passed as a REFERENCE (marked "use server"), with
 * its arguments in `actionArgs` — wrapping it in a closure from a server
 * component is not allowed (functions can't be serialized).
 */
export function ConfirmActionButton<TArgs extends unknown[]>({
  label,
  variant = "dangerGhost",
  size = "sm",
  confirmTitle,
  confirmDescription,
  confirmLabel,
  icon,
  action,
  actionArgs = [] as unknown as TArgs,
  onDone,
  redirectTo,
}: {
  label: string;
  variant?: "secondary" | "dangerGhost" | "destructive" | "ghost";
  size?: "sm" | "md";
  confirmTitle: string;
  confirmDescription: string;
  confirmLabel: string;
  icon?: React.ReactNode;
  /** Server action to run on confirm. Return { ok } on success. */
  action: (...args: TArgs) => Promise<{ ok?: boolean; error?: string }>;
  /** Serialized arguments passed to the server action. */
  actionArgs?: TArgs;
  /** Called after a successful action (e.g. navigate away). */
  onDone?: () => void;
  /** Navigate here after a successful action. */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await action(...actionArgs);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      if (redirectTo) {
        router.push(redirectTo);
        router.refresh();
      }
      onDone?.();
    });
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        {icon}
        {label}
      </Button>

      <ConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        title={confirmTitle}
        description={error ?? confirmDescription}
        confirmLabel={confirmLabel}
        destructive={variant !== "secondary"}
        loading={pending}
        onConfirm={handleConfirm}
      />
    </>
  );
}
