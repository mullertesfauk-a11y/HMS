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
    <section className="py-8 sm:py-12 md:py-14">
      <div className="flex items-baseline gap-3 border-b border-stone-200 pb-4">
        <h2 className="font-luxury text-lg font-semibold uppercase tracking-wider text-stone-900 sm:text-xl md:text-2xl">
          Chef&apos;s Favorites
        </h2>
        <span className="h-[1px] flex-1 bg-stone-200" />
      </div>

      {/* Mobile: horizontal snap scroll. Tablet+: 2-col. Desktop: 3-col. */}
      <div className="-mx-4 mt-6 flex gap-4 overflow-x-auto px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible sm:gap-6 sm:pb-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className="group w-52 shrink-0 snap-start text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-auto sm:snap-align-none rounded-xl"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-stone-100">
              <MenuItemImage src={item.image} alt={item.name} className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-stone-100" />
            </div>
            <div className="mt-2.5 sm:mt-3">
              <h3 className="font-luxury text-sm font-semibold text-stone-900 transition-colors group-hover:text-brand sm:text-base">
                {item.name}
              </h3>
              <p className="mt-0.5 text-xs text-stone-500 sm:text-sm">
                {formatMoney(item.price, currency)}
              </p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
