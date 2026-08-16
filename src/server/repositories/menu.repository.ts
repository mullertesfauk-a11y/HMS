import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { DbClient } from "@/server/repositories/types";

/**
 * Menu persistence layer. Thin — availability/pricing logic lives in services.
 */
export const menuRepository = {
  // -------------------------------------------------------------------------
  // Categories
  // -------------------------------------------------------------------------

  findCategoryById(id: string) {
    return prisma.menuCategory.findUnique({ where: { id } });
  },

  findCategoryBySlug(hotelId: string, slug: string) {
    return prisma.menuCategory.findFirst({ where: { hotelId, slug } });
  },

  /** All categories for a hotel (admin view), ordered by sortOrder. */
  listCategories(hotelId: string) {
    return prisma.menuCategory.findMany({
      where: { hotelId },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { items: true } } },
    });
  },

  /** ACTIVE categories with their items — the public menu source of truth. */
  listPublicCategories(hotelId: string) {
    return prisma.menuCategory.findMany({
      where: { hotelId, isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
      },
    });
  },

  createCategory(data: Prisma.MenuCategoryUncheckedCreateInput) {
    return prisma.menuCategory.create({ data });
  },

  updateCategory(id: string, data: Prisma.MenuCategoryUncheckedUpdateInput) {
    return prisma.menuCategory.update({ where: { id }, data });
  },

  deleteCategory(id: string) {
    return prisma.menuCategory.delete({ where: { id } });
  },

  // -------------------------------------------------------------------------
  // Items
  // -------------------------------------------------------------------------

  findItemById(id: string) {
    return prisma.menuItem.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true, slug: true } } },
    });
  },

  /** Number of items in a category (guards category deletion). */
  countItemsInCategory(categoryId: string) {
    return prisma.menuItem.count({ where: { categoryId } });
  },

  findItemBySlug(hotelId: string, slug: string, db?: DbClient) {
    const client = db ?? prisma;
    return client.menuItem.findFirst({
      where: { hotelId, slug },
      include: { category: { select: { id: true, slug: true, isActive: true } } },
    });
  },

  /**
   * Fetch items by public slug (used inside the order transaction so prices
   * and availability are read fresh from the source of truth).
   */
  findItemsBySlugs(hotelId: string, slugs: string[], db?: DbClient) {
    const client = db ?? prisma;
    return client.menuItem.findMany({
      where: { hotelId, slug: { in: slugs } },
      include: { category: { select: { id: true, slug: true, isActive: true } } },
    });
  },

  async listItems(params: {
    hotelId: string;
    search?: string;
    categoryId?: string;
    isAvailable?: boolean;
    skip: number;
    take: number;
    orderBy?: Prisma.MenuItemOrderByWithRelationInput;
  }) {
    const where: Prisma.MenuItemWhereInput = { hotelId: params.hotelId };
    if (params.search) {
      const term = params.search.trim();
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { nameAm: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
      ];
    }
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.isAvailable !== undefined) where.isAvailable = params.isAvailable;

    const [items, total] = await prisma.$transaction([
      prisma.menuItem.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy ?? [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
        include: { category: { select: { id: true, name: true, slug: true } } },
      }),
      prisma.menuItem.count({ where }),
    ]);

    return { items, total };
  },

  createItem(data: Prisma.MenuItemUncheckedCreateInput) {
    return prisma.menuItem.create({ data });
  },

  updateItem(id: string, data: Prisma.MenuItemUncheckedUpdateInput) {
    return prisma.menuItem.update({ where: { id }, data });
  },

  deleteItem(id: string) {
    return prisma.menuItem.delete({ where: { id } });
  },
};
