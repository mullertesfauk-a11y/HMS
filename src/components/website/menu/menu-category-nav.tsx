"use client";

import { cn } from "@/lib/utils/cn";
import type { MenuCategory } from "@/lib/menu/menu-types";
import { CATEGORY_ALL } from "@/lib/menu/menu-types";

export function MenuCategoryNav({
  categories,
  active,
  onSelect,
}: {
  categories: MenuCategory[];
  active: string;
  onSelect: (id: string) => void;
}) {
  const allCategories = [
    { id: CATEGORY_ALL, name: "All", nameAm: "ሁሉም" },
    ...categories,
  ];

  return (
    <div className="relative w-full md:flex-wrap md:justify-center">
      {/* Fade edges on mobile scroll */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-white to-transparent sm:hidden" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-white to-transparent sm:hidden" />

      <div className="flex items-center gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-wrap md:justify-center md:overflow-visible">
        {allCategories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            aria-pressed={active === cat.id}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest transition-all duration-200 sm:px-5 sm:py-2.5",
              active === cat.id
                ? "bg-stone-900 text-white shadow-md"
                : "border border-stone-200 bg-white text-stone-600 hover:border-stone-400 hover:text-stone-900",
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
}
