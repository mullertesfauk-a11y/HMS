"use client";

import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";

export function MenuSearch({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (q: string) => void;
}) {
  const t = useTranslations("menu");

  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
      <input
        type="search"
        inputMode="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="h-11 w-full rounded-full border border-stone-200 bg-white pl-11 pr-10 text-sm text-stone-900 shadow-sm transition-all placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200 sm:h-12"
      />
      {query && (
        <button
          type="button"
          onClick={() => onQueryChange("")}
          aria-label={t("clearSearch")}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
