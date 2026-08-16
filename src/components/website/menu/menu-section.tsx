import type { MenuItem as MenuItemType } from "@/lib/menu/menu-types";
import { MenuItemCard } from "@/components/website/menu/menu-item-card";

export function MenuSection({
  name,
  nameAm,
  items,
  currency,
  onSelectItem,
  onAddToCart,
}: {
  name: string;
  nameAm: string;
  items: MenuItemType[];
  currency: string;
  onSelectItem: (item: MenuItemType) => void;
  onAddToCart: (item: MenuItemType) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section className="py-6 sm:py-12 md:py-14">
      <div className="flex items-baseline gap-3 border-b border-stone-200 pb-3 sm:pb-4">
        <h2 className="font-luxury text-base font-semibold uppercase tracking-wider text-stone-900 sm:text-xl md:text-2xl">
          {name}
        </h2>
        <span lang="am" className="text-xs text-stone-400">
          {nameAm}
        </span>
        <span className="h-[1px] flex-1 bg-stone-200" />
      </div>
      <div className="mt-5 gap-x-8 gap-y-6 sm:mt-8 sm:gap-x-10 sm:gap-y-10 md:grid-cols-2">
        {items.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            currency={currency}
            onSelect={onSelectItem}
            onAddToCart={onAddToCart}
          />
        ))}
      </div>
    </section>
  );
}
