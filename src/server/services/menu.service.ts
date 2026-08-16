import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { DIETARY_TAGS, MENU_ITEM_BADGES } from "@/lib/menu/menu-types";
import type {
  CreateMenuCategoryInput,
  CreateMenuItemInput,
  UpdateMenuCategoryInput,
  UpdateMenuItemInput,
} from "@/lib/validation/menu";
import { menuRepository } from "@/server/repositories/menu.repository";
import { hotelService } from "@/server/services/hotel.service";

/**
 * Menu service.
 *
 * Public reads return sanitized views (no internal status fields, prices as
 * plain numbers) for the website and a future mobile app. Admin operations
 * validate against the shared unions in src/lib/menu/menu-types.ts — the
 * database stores dietary tags / badges as plain strings.
 */

export interface PublicMenuCategory {
  id: string;
  slug: string;
  name: string;
  nameAm: string;
  sortOrder: number;
  isActive: boolean;
}

export interface PublicMenuItem {
  id: string;
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
  dietaryTags: (typeof DIETARY_TAGS)[number][];
  badges: (typeof MENU_ITEM_BADGES)[number][];
  sortOrder: number;
}

export interface PublicMenu {
  categories: PublicMenuCategory[];
  items: PublicMenuItem[];
}

export class MenuService {
  /**
   * Public menu: ACTIVE categories with their items. Unavailable items are
   * included so the UI can show "sold out" states; they cannot be ordered.
   */
  async getPublicMenu(): Promise<PublicMenu> {
    const hotel = await hotelService.getDefaultHotel();
    const categories = await menuRepository.listPublicCategories(hotel.id);

    return {
      categories: categories.map((category) => this.toCategoryView(category)),
      items: categories.flatMap((category) => category.items.map((item) => this.toItemView(item))),
    };
  }

  // -------------------------------------------------------------------------
  // Admin — categories
  // -------------------------------------------------------------------------

  async listCategories() {
    const hotel = await hotelService.getDefaultHotel();
    return menuRepository.listCategories(hotel.id);
  }

  async createCategory(input: CreateMenuCategoryInput) {
    const hotel = await hotelService.getDefaultHotel();

    const existing = await menuRepository.findCategoryBySlug(hotel.id, input.slug);
    if (existing) {
      throw new ConflictError("A category with this slug already exists");
    }

    const category = await menuRepository.createCategory({
      hotelId: hotel.id,
      slug: input.slug,
      name: input.name,
      nameAm: input.nameAm,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    });

    logger.info("menu.category.created", { categoryId: category.id, slug: category.slug });
    return category;
  }

  async updateCategory(id: string, input: UpdateMenuCategoryInput) {
    const category = await menuRepository.findCategoryById(id);
    if (!category) throw new NotFoundError("Menu category not found");

    const updated = await menuRepository.updateCategory(id, {
      name: input.name,
      nameAm: input.nameAm,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
    });

    logger.info("menu.category.updated", { categoryId: id, slug: category.slug });
    return updated;
  }

  /** Categories with items cannot be deleted — move or delete the items first. */
  async deleteCategory(id: string) {
    const category = await menuRepository.findCategoryById(id);
    if (!category) throw new NotFoundError("Menu category not found");

    const itemCount = await menuRepository.countItemsInCategory(id);
    if (itemCount > 0) {
      throw new ConflictError(
        "This category still has items. Move or delete them before removing the category.",
      );
    }

    await menuRepository.deleteCategory(id);
    logger.info("menu.category.deleted", { categoryId: id, slug: category.slug });
  }

  // -------------------------------------------------------------------------
  // Admin — items
  // -------------------------------------------------------------------------

  async listItems(params: {
    search?: string;
    categoryId?: string;
    isAvailable?: boolean;
    skip: number;
    take: number;
    orderBy?: Prisma.MenuItemOrderByWithRelationInput;
  }) {
    const hotel = await hotelService.getDefaultHotel();
    return menuRepository.listItems({ hotelId: hotel.id, ...params });
  }

  async createItem(input: CreateMenuItemInput) {
    const hotel = await hotelService.getDefaultHotel();

    const category = await menuRepository.findCategoryById(input.categoryId);
    if (!category || category.hotelId !== hotel.id) {
      throw new NotFoundError("Menu category not found");
    }

    const existing = await menuRepository.findItemBySlug(hotel.id, input.slug);
    if (existing) {
      throw new ConflictError("An item with this slug already exists");
    }

    const item = await menuRepository.createItem({
      hotelId: hotel.id,
      categoryId: input.categoryId,
      slug: input.slug,
      name: input.name,
      nameAm: input.nameAm,
      description: input.description,
      descriptionAm: input.descriptionAm ?? null,
      price: input.price,
      image: input.image || null,
      isAvailable: input.isAvailable,
      isFeatured: input.isFeatured,
      dietaryTags: input.dietaryTags,
      badges: input.badges,
      sortOrder: input.sortOrder,
    });

    logger.info("menu.item.created", { itemId: item.id, slug: item.slug });
    return item;
  }

  async updateItem(id: string, input: UpdateMenuItemInput) {
    const item = await menuRepository.findItemById(id);
    if (!item) throw new NotFoundError("Menu item not found");

    if (input.categoryId) {
      const category = await menuRepository.findCategoryById(input.categoryId);
      if (!category) throw new NotFoundError("Menu category not found");
    }

    const updated = await menuRepository.updateItem(id, {
      categoryId: input.categoryId,
      name: input.name,
      nameAm: input.nameAm,
      description: input.description,
      descriptionAm:
        input.descriptionAm === undefined ? undefined : input.descriptionAm,
      price: input.price,
      image: input.image === undefined ? undefined : input.image || null,
      isAvailable: input.isAvailable,
      isFeatured: input.isFeatured,
      dietaryTags: input.dietaryTags,
      badges: input.badges,
      sortOrder: input.sortOrder,
    });

    logger.info("menu.item.updated", { itemId: id, slug: item.slug });
    return updated;
  }

  async deleteItem(id: string) {
    const item = await menuRepository.findItemById(id);
    if (!item) throw new NotFoundError("Menu item not found");

    await menuRepository.deleteItem(id);
    logger.info("menu.item.deleted", { itemId: id, slug: item.slug });
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private toCategoryView(category: {
    id: string;
    slug: string;
    name: string;
    nameAm: string;
    sortOrder: number;
    isActive: boolean;
  }): PublicMenuCategory {
    return {
      id: category.id,
      slug: category.slug,
      name: category.name,
      nameAm: category.nameAm,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    };
  }

  private toItemView(item: {
    id: string;
    slug: string;
    categoryId: string;
    name: string;
    nameAm: string;
    description: string;
    descriptionAm: string | null;
    price: { toNumber(): number };
    image: string | null;
    isAvailable: boolean;
    isFeatured: boolean;
    dietaryTags: string[];
    badges: string[];
    sortOrder: number;
  }): PublicMenuItem {
    return {
      id: item.id,
      slug: item.slug,
      categoryId: item.categoryId,
      name: item.name,
      nameAm: item.nameAm,
      description: item.description,
      descriptionAm: item.descriptionAm ?? undefined,
      price: item.price.toNumber(),
      image: item.image ?? undefined,
      isAvailable: item.isAvailable,
      isFeatured: item.isFeatured,
      dietaryTags: item.dietaryTags as PublicMenuItem["dietaryTags"],
      badges: item.badges as PublicMenuItem["badges"],
      sortOrder: item.sortOrder,
    };
  }
}

export const menuService = new MenuService();
