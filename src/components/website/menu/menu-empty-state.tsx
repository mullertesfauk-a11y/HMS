"use client";

import { UtensilsCrossed } from "lucide-react";
import { useTranslations } from "next-intl";

export function MenuEmptyState({
  type,
  query,
  onClear,
}: {
  type: "empty" | "no-results";
  query?: string;
  onClear?: () => void;
}) {
  const t = useTranslations("menu");
  const tCommon = useTranslations("common");

  if (type === "no-results") {
    return (
      <div className="py-20 text-center">
        <UtensilsCrossed className="mx-auto h-10 w-10 text-stone-300" />
        <h3 className="mt-4 font-display text-xl text-stone-900">
          {t("noResults")}{query ? ` for "${query}"` : ""}
        </h3>
        <p className="mt-2 text-sm text-stone-500">
          {t("noResultsDesc", { query: query ?? "" })}
        </p>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="mt-4 text-xs font-semibold uppercase tracking-widest text-brand hover:text-brand-dark transition-colors"
          >
            {t("clearSearch")}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="py-20 text-center">
      <UtensilsCrossed className="mx-auto h-10 w-10 text-stone-300" />
      <h3 className="mt-4 font-display text-xl text-stone-900">
        {t("noResults")}
      </h3>
      <p className="mt-2 text-sm text-stone-500">
        {t("noResultsDesc", { query: "" })}
      </p>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 text-xs font-semibold uppercase tracking-widest text-brand hover:text-brand-dark transition-colors"
        >
          {tCommon("viewAll")}
        </button>
      )}
    </div>
  );
}
