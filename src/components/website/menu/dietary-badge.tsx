import { Leaf, Flame, WheatOff, Milk, Nut } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { DietaryTag } from "@/lib/menu/menu-types";

const DIETARY_CONFIG: Record<
  DietaryTag,
  { label: string; icon?: React.ComponentType<{ className?: string }>; className: string }
> = {
  vegetarian: {
    label: "Vegetarian",
    icon: Leaf,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  vegan: {
    label: "Vegan",
    icon: Leaf,
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  spicy: {
    label: "Spicy",
    icon: Flame,
    className: "bg-red-50 text-red-700 border-red-200",
  },
  "gluten-free": {
    label: "GF",
    icon: WheatOff,
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  "contains-dairy": {
    label: "Dairy",
    icon: Milk,
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  "contains-nuts": {
    label: "Nuts",
    icon: Nut,
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
  "contains-garlic": {
    label: "Garlic",
    className: "bg-stone-100 text-stone-600 border-stone-200",
  },
};

export function DietaryBadge({ tag }: { tag: DietaryTag }) {
  const config = DIETARY_CONFIG[tag];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        config.className,
      )}
    >
      {Icon && <Icon className="h-3 w-3" aria-hidden />}
      <span>{config.label}</span>
    </span>
  );
}
