"use client";

import React from "react";
import { ShoppingBag } from "lucide-react";
import type { MenuCategory, MenuItem } from "@/lib/menu/menu-types";
import { CATEGORY_ALL } from "@/lib/menu/menu-types";
import { formatMoney } from "@/lib/utils/display";
import { MenuCategoryNav } from "@/components/website/menu/menu-category-nav";
import { MenuSearch } from "@/components/website/menu/menu-search";
import { MenuFeatured } from "@/components/website/menu/menu-featured";
import { MenuSection } from "@/components/website/menu/menu-section";
import { MenuEmptyState } from "@/components/website/menu/menu-empty-state";
import { MenuItemDetails } from "@/components/website/menu/menu-item-details";
import { MenuCart, type CartLine } from "@/components/website/menu/menu-cart";

const MAX_QUANTITY = 20;

export function MenuBrowser({
  categories,
  items,
  currency,
  taxRate,
}: {
  categories: MenuCategory[];
  items: MenuItem[];
  currency: string;
  taxRate: number;
}) {
  const [activeCategory, setActiveCategory] = React.useState(CATEGORY_ALL);
  const [query, setQuery] = React.useState("");
  const [selectedItem, setSelectedItem] = React.useState<MenuItem | null>(null);

  // Cart state (lifted so the bar, details modal and checkout share it).
  const [cart, setCart] = React.useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = React.useState(false);

  const addToCart = React.useCallback((item: MenuItem, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((line) => line.slug === item.slug);
      if (existing) {
        return prev.map((line) =>
          line.slug === item.slug
            ? { ...line, quantity: Math.min(line.quantity + quantity, MAX_QUANTITY) }
            : line,
        );
      }
      return [...prev, { slug: item.slug, name: item.name, price: item.price, quantity }];
    });
  }, []);

  const updateQuantity = React.useCallback((slug: string, quantity: number) => {
    setCart((prev) =>
      quantity <= 0
        ? prev.filter((line) => line.slug !== slug)
        : prev.map((line) =>
            line.slug === slug ? { ...line, quantity: Math.min(quantity, MAX_QUANTITY) } : line,
          ),
    );
  }, []);

  const removeFromCart = React.useCallback((slug: string) => {
    setCart((prev) => prev.filter((line) => line.slug !== slug));
  }, []);

  const clearCart = React.useCallback(() => setCart([]), []);

  const itemCount = cart.reduce((count, line) => count + line.quantity, 0);
  const cartTotal = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);

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
      <div className="mx-auto max-w-5xl px-3 sm:px-6 lg:px-8">
        {/* Search */}
        <div className="flex justify-center pt-2 pb-3 sm:py-6">
          <MenuSearch query={query} onQueryChange={setQuery} />
        </div>

        {/* Category nav */}
        <div className="flex justify-center py-1.5 sm:py-2">
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
                onAddToCart={addToCart}
              />
            ))}

        {/* Bottom padding so the floating cart bar never covers the last card */}
        {itemCount > 0 && <div className="h-24" />}
      </div>

      {/* Floating cart bar */}
      {itemCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),1rem)] sm:px-6">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 rounded-full bg-stone-900 py-3.5 pl-5 pr-3 text-white shadow-xl transition-colors hover:bg-brand"
          >
            <span className="flex items-center gap-2.5 text-sm font-semibold">
              <ShoppingBag className="h-4 w-4" />
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
            <span className="flex items-center gap-3">
              <span className="text-sm font-bold">
                {formatMoney(cartTotal, currency)}
              </span>
              <span className="rounded-full bg-white/15 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest">
                View Order
              </span>
            </span>
          </button>
        </div>
      )}

      {/* Details modal / bottom sheet */}
      {selectedItem && (
        <MenuItemDetails
          item={selectedItem}
          currency={currency}
          onClose={() => setSelectedItem(null)}
          onAddToCart={addToCart}
        />
      )}

      {/* Cart dialog */}
      {cartOpen && (
        <MenuCart
          lines={cart}
          currency={currency}
          taxRate={taxRate}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
          onClear={clearCart}
          onClose={() => setCartOpen(false)}
        />
      )}
    </>
  );
}
