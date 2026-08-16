"use client";

import type { MenuItem } from "@/lib/menu/menu-types";
import { formatMoney } from "@/lib/utils/display";
import { MenuItemImage } from "@/components/website/menu/menu-item-image";

export function MenuFeatured({
  items,
  currency,
  onSelect,
}: {
  items: MenuItem[];
  currency: string;
  onSelect: (item: MenuItem) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section className="py-10 sm:py-14">
      <div className="flex items-baseline gap-3 border-b border-stone-200 pb-4">
        <h2 className="font-luxury text-xl font-semibold uppercase tracking-wider text-stone-900 sm:text-2xl">
          Chef&apos;s Favorites
        </h2>
        <span className="h-[1px] flex-1 bg-stone-200" />
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className="group text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand rounded-xl"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-stone-100">
              <MenuItemImage src={item.image} alt={item.name} className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-stone-100" />
            </div>
            <div className="mt-3">
              <h3 className="font-luxury text-base font-semibold text-stone-900 transition-colors group-hover:text-brand">
                {item.name}
              </h3>
              <p className="mt-0.5 text-sm text-stone-500">
                {formatMoney(item.price, currency)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
