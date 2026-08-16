import type { MenuItem as MenuItemType } from "@/lib/menu/menu-types";
import { MenuItemCard } from "@/components/website/menu/menu-item-card";

export function MenuSection({
  name,
  nameAm,
  items,
  currency,
  onSelectItem,
}: {
  name: string;
  nameAm: string;
  items: MenuItemType[];
  currency: string;
  onSelectItem: (item: MenuItemType) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section className="py-10 sm:py-14">
      <div className="flex items-baseline gap-3 border-b border-stone-200 pb-4">
        <h2 className="font-luxury text-xl font-semibold uppercase tracking-wider text-stone-900 sm:text-2xl">
          {name}
        </h2>
        <span lang="am" className="text-xs text-stone-400">
          {nameAm}
        </span>
        <span className="h-[1px] flex-1 bg-stone-200" />
      </div>
      <div className="mt-8 grid gap-x-10 gap-y-10 md:grid-cols-2">
        {items.map((item) => (
          <MenuItemCard
            key={item.id}
            item={item}
            currency={currency}
            onSelect={onSelectItem}
          />
        ))}
      </div>
    </section>
  );
}
