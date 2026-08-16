"use client";

import { Plus } from "lucide-react";
import type { MenuItem } from "@/lib/menu/menu-types";
import { formatMoney } from "@/lib/utils/display";
import { MenuItemImage } from "@/components/website/menu/menu-item-image";
import { DietaryBadge } from "@/components/website/menu/dietary-badge";

function BadgePill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-800 border border-amber-200">
      {label}
    </span>
  );
}

export function MenuItemCard({
  item,
  currency,
  onSelect,
  onAddToCart,
}: {
  item: MenuItem;
  currency: string;
  onSelect: (item: MenuItem) => void;
  onAddToCart: (item: MenuItem) => void;
}) {
  const badgeLabels: Record<string, string> = {
    popular: "Popular",
    "chef-pick": "Chef's Pick",
    new: "New",
  };

  const visibleBadges = item.badges.slice(0, 2);
  const mainDietary = item.dietaryTags.filter((t) => t !== "contains-garlic").slice(0, 3);

  return (
    <article className="group flex gap-3 sm:gap-4 md:gap-5">
      {/* Image */}
      <button
        type="button"
        onClick={() => onSelect(item)}
        aria-label={`View details for ${item.name}`}
        className="relative shrink-0 w-28 sm:w-36 md:w-44 overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <MenuItemImage src={item.image} alt={item.name} />
        {!item.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-900/60 rounded-xl">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white">
              Sold Out
            </span>
          </div>
        )}
      </button>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => onSelect(item)}
              className="text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand rounded-sm"
            >
              <h3 className="font-luxury text-lg sm:text-xl font-semibold text-stone-900 transition-colors group-hover:text-brand">
                {item.name}
              </h3>
            </button>
            <span lang="am" className="text-xs text-stone-400">
              {item.nameAm}
            </span>
          </div>

          {/* Badges */}
          {visibleBadges.length > 0 && (
            <div className="flex shrink-0 gap-1">
              {visibleBadges.map((b) => (
                <BadgePill key={b} label={badgeLabels[b] ?? b} />
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-stone-500">
          {item.description}
        </p>

        {/* Dietary tags */}
        {mainDietary.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {mainDietary.map((tag) => (
              <DietaryBadge key={tag} tag={tag} />
            ))}
          </div>
        )}

        {/* Price + CTA */}
        <div className="mt-auto flex items-end justify-between pt-3">
          <span className="font-luxury text-lg font-bold text-stone-900">
            {formatMoney(item.price, currency)}
          </span>
          <button
            type="button"
            onClick={() => onAddToCart(item)}
            disabled={!item.isAvailable}
            aria-label={item.isAvailable ? `Add ${item.name} to cart` : `${item.name} sold out`}
            title={item.isAvailable ? "Add to cart" : "Sold out"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-400 transition-all hover:border-stone-400 hover:text-stone-700 disabled:cursor-not-allowed disabled:opacity-40 sm:h-9 sm:w-9"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
