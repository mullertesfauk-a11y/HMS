"use client";

import { UtensilsCrossed } from "lucide-react";

export function MenuEmptyState({
  type,
  query,
  onClear,
}: {
  type: "empty" | "no-results";
  query?: string;
  onClear?: () => void;
}) {
  if (type === "no-results") {
    return (
      <div className="py-20 text-center">
        <UtensilsCrossed className="mx-auto h-10 w-10 text-stone-300" />
        <h3 className="mt-4 font-display text-xl text-stone-900">
          No dishes found{query ? ` for "${query}"` : ""}
        </h3>
        <p className="mt-2 text-sm text-stone-500">
          Try searching for another dish.
        </p>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="mt-4 text-xs font-semibold uppercase tracking-widest text-brand hover:text-brand-dark transition-colors"
          >
            Clear Search
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="py-20 text-center">
      <UtensilsCrossed className="mx-auto h-10 w-10 text-stone-300" />
      <h3 className="mt-4 font-display text-xl text-stone-900">
        No dishes available
      </h3>
      <p className="mt-2 text-sm text-stone-500">
        The menu is currently being updated.
      </p>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 text-xs font-semibold uppercase tracking-widest text-brand hover:text-brand-dark transition-colors"
        >
          View All
        </button>
      )}
    </div>
  );
}
