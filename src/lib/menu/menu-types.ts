export type DietaryTag =
  | "vegetarian"
  | "vegan"
  | "spicy"
  | "gluten-free"
  | "contains-dairy"
  | "contains-nuts"
  | "contains-garlic";

export type MenuItemBadge = "popular" | "chef-pick" | "new";

export interface MenuCategory {
  id: string;
  name: string;
  nameAm: string;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuItem {
  id: string;
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
