export const DIETARY_TAGS = [
  "vegetarian",
  "vegan",
  "spicy",
  "gluten-free",
  "contains-dairy",
  "contains-nuts",
  "contains-garlic",
] as const;

export type DietaryTag = (typeof DIETARY_TAGS)[number];

export const MENU_ITEM_BADGES = ["popular", "chef-pick", "new"] as const;

export type MenuItemBadge = (typeof MENU_ITEM_BADGES)[number];

export interface MenuCategory {
  id: string;
  /** Stable public reference used by ordering (never internal ids). */
  slug: string;
  name: string;
  nameAm: string;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
  /** Stable public reference used by ordering (never internal ids). */
  slug: string;
  categoryId: string;
  name: string;
  nameAm: string;
  description: string;
  descriptionAm?: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  isFeatured: boolean;
  dietaryTags: DietaryTag[];
  badges: MenuItemBadge[];
  sortOrder: number;
}

export const CATEGORY_ALL = "all";
