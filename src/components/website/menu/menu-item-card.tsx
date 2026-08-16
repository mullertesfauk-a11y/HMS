"use client";

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
  onAddToCart: _onAddToCart,
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
    <article className="group flex gap-3 sm:gap-5">
      {/* Image */}
      <button
        type="button"
        onClick={() => onSelect(item)}
        aria-label={`View details for ${item.name}`}
        className="relative shrink-0 w-32 sm:w-40 md:w-48 overflow-hidden rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
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
        {/* Title + badges stacked on mobile, side-by-side on sm+ */}
        <div>
          <button
            type="button"
            onClick={() => onSelect(item)}
            className="text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand rounded-sm"
          >
            <h3 className="font-luxury text-base sm:text-xl font-semibold text-stone-900 transition-colors group-hover:text-brand">
              {item.name}
            </h3>
          </button>
          <span lang="am" className="text-xs text-stone-400">
            {item.nameAm}
          </span>
          {visibleBadges.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1 sm:hidden">
              {visibleBadges.map((b) => (
                <BadgePill key={b} label={badgeLabels[b] ?? b} />
              ))}
            </div>
          )}
        </div>

        {/* Badges on sm+ (inline, right of heading) */}
        {visibleBadges.length > 0 && (
          <div className="hidden sm:flex mt-1 gap-1">
            {visibleBadges.map((b) => (
              <BadgePill key={b} label={badgeLabels[b] ?? b} />
            ))}
          </div>
        )}

        {/* Description */}
        <p className="mt-1 line-clamp-1 text-[13px] leading-relaxed text-stone-500 sm:mt-1.5 sm:line-clamp-2 sm:text-sm">
          {item.description}
        </p>

        {/* Dietary tags */}
        {mainDietary.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1 sm:mt-2">
            {mainDietary.map((tag) => (
              <DietaryBadge key={tag} tag={tag} />
            ))}
          </div>
        )}

        {/* Price + CTA */}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2.5 sm:pt-3">
          <span className="font-luxury text-base sm:text-lg font-bold text-stone-900">
            {formatMoney(item.price, currency)}
          </span>
          <button
            type="button"
            onClick={() => onSelect(item)}
            disabled={!item.isAvailable}
            aria-label={item.isAvailable ? `View ${item.name}` : `${item.name} sold out`}
            className="shrink-0 rounded-full border border-stone-200 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-stone-600 transition-all hover:border-stone-400 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40 sm:text-xs"
          >
            {item.isAvailable ? "View" : "Sold Out"}
          </button>
        </div>
      </div>
    </article>
  );
}
