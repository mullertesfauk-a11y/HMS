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
    <div className="flex items-center gap-2 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:flex-wrap md:justify-center md:overflow-visible">
      {allCategories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelect(cat.id)}
          aria-pressed={active === cat.id}
          className={cn(
            "shrink-0 rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-widest transition-all duration-200",
            active === cat.id
              ? "bg-stone-900 text-white shadow-md"
              : "border border-stone-200 bg-white text-stone-600 hover:border-stone-400 hover:text-stone-900",
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
