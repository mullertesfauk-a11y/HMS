"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Error boundary for protected admin pages. Permission failures are handled
 * by server-side redirects (`requirePermissionPage`), so this only catches
 * unexpected runtime errors — details are logged server-side.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <span
        aria-hidden
        className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-light text-brand-dark"
      >
        <TriangleAlert className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-lg font-semibold text-foreground">
        Something went wrong
      </h1>
      <p className="mt-1 max-w-md text-sm text-stone-500">
        An unexpected error occurred while loading this page. Please try again.
      </p>
      <div className="mt-5 flex gap-2">
        <Button onClick={reset} variant="secondary">
          Try again
        </Button>
      </div>
    </div>
  );
}
