"use client";

import React from "react";
import type { MenuCategory, MenuItem } from "@/lib/menu/menu-types";
import { CATEGORY_ALL } from "@/lib/menu/menu-types";
import { MenuCategoryNav } from "@/components/website/menu/menu-category-nav";
import { MenuSearch } from "@/components/website/menu/menu-search";
import { MenuFeatured } from "@/components/website/menu/menu-featured";
import { MenuSection } from "@/components/website/menu/menu-section";
import { MenuEmptyState } from "@/components/website/menu/menu-empty-state";
import { MenuItemDetails } from "@/components/website/menu/menu-item-details";

export function MenuBrowser({
  categories,
  items,
  currency,
}: {
  categories: MenuCategory[];
  items: MenuItem[];
  currency: string;
}) {
  const [activeCategory, setActiveCategory] = React.useState(CATEGORY_ALL);
  const [query, setQuery] = React.useState("");
  const [selectedItem, setSelectedItem] = React.useState<MenuItem | null>(null);

  const trimmedQuery = query.trim().toLowerCase();

  const featured = React.useMemo(
    () => items.filter((i) => i.isFeatured),
    [items],
  );

  const filtered = React.useMemo(() => {
    let result = items;

    if (activeCategory !== CATEGORY_ALL) {
      result = result.filter((i) => i.categoryId === activeCategory);
    }

    if (trimmedQuery) {
      result = result.filter(
        (i) =>
          i.name.toLowerCase().includes(trimmedQuery) ||
          i.nameAm.includes(trimmedQuery) ||
          i.description.toLowerCase().includes(trimmedQuery),
      );
    }

    return result;
  }, [items, activeCategory, trimmedQuery]);

  const grouped = React.useMemo(() => {
    const groups = new Map<string, MenuItem[]>();
    for (const item of filtered) {
      const list = groups.get(item.categoryId);
      if (list) {
        list.push(item);
      } else {
        groups.set(item.categoryId, [item]);
      }
    }
    return groups;
  }, [filtered]);

  const showFeatured =
    activeCategory === CATEGORY_ALL && !trimmedQuery && featured.length > 0;
  const noResults = filtered.length === 0;

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Search */}
        <div className="flex justify-center py-6">
          <MenuSearch query={query} onQueryChange={setQuery} />
        </div>

        {/* Category nav */}
        <div className="flex justify-center py-2">
          <MenuCategoryNav
            categories={categories}
            active={activeCategory}
            onSelect={setActiveCategory}
          />
        </div>

        {/* Featured */}
        {showFeatured && (
          <MenuFeatured
            items={featured}
            currency={currency}
            onSelect={setSelectedItem}
          />
        )}

        {/* Empty / no results */}
        {noResults && (
          <MenuEmptyState
            type={trimmedQuery ? "no-results" : "empty"}
            query={trimmedQuery || undefined}
            onClear={trimmedQuery ? () => setQuery("") : () => setActiveCategory(CATEGORY_ALL)}
          />
        )}

        {/* Menu sections */}
        {!noResults &&
          categories
            .filter((cat) => grouped.has(cat.id))
            .map((cat) => (
              <MenuSection
                key={cat.id}
                name={cat.name}
                nameAm={cat.nameAm}
                items={grouped.get(cat.id)!}
                currency={currency}
                onSelectItem={setSelectedItem}
              />
            ))}
      </div>

      {/* Details modal / bottom sheet */}
      {selectedItem && (
        <MenuItemDetails
          item={selectedItem}
          currency={currency}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </>
  );
}
