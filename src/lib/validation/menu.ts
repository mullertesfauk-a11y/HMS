import { z } from "zod";

import { DIETARY_TAGS, MENU_ITEM_BADGES } from "@/lib/menu/menu-types";

/** Slugs are stable public references, kebab-case. */
const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase kebab-case (e.g. doro-wot)");

const priceSchema = z.number("Price is required").positive("Price must be positive").max(1_000_000);

/** Optional image URL — empty string means "no image". */
const imageSchema = z.union([z.string().url("Image must be a valid URL").max(2000), z.literal("")]).optional();

export const createMenuCategorySchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1, "Name is required").max(100),
  nameAm: z.string().trim().min(1, "Amharic name is required").max(200),
  sortOrder: z.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
});

export type CreateMenuCategoryInput = z.infer<typeof createMenuCategorySchema>;

export const updateMenuCategorySchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100).optional(),
    nameAm: z.string().trim().min(1, "Amharic name is required").max(200).optional(),
    sortOrder: z.number().int().min(0).max(999).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

export type UpdateMenuCategoryInput = z.infer<typeof updateMenuCategorySchema>;

export const createMenuItemSchema = z.object({
  slug: slugSchema,
  categoryId: z.string().cuid("Invalid category"),
  name: z.string().trim().min(1, "Name is required").max(100),
  nameAm: z.string().trim().min(1, "Amharic name is required").max(200),
  description: z.string().trim().min(1, "Description is required").max(2000),
  descriptionAm: z.string().trim().max(2000).optional(),
  price: priceSchema,
  image: imageSchema,
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  dietaryTags: z.array(z.enum(DIETARY_TAGS)).max(10).default([]),
  badges: z.array(z.enum(MENU_ITEM_BADGES)).max(3).default([]),
  sortOrder: z.number().int().min(0).max(999).default(0),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;

export const updateMenuItemSchema = z
  .object({
    categoryId: z.string().cuid("Invalid category").optional(),
    name: z.string().trim().min(1, "Name is required").max(100).optional(),
    nameAm: z.string().trim().min(1, "Amharic name is required").max(200).optional(),
    description: z.string().trim().min(1, "Description is required").max(2000).optional(),
    descriptionAm: z.string().trim().max(2000).nullable().optional(),
    price: priceSchema.optional(),
    image: imageSchema,
    isAvailable: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    dietaryTags: z.array(z.enum(DIETARY_TAGS)).max(10).optional(),
    badges: z.array(z.enum(MENU_ITEM_BADGES)).max(3).optional(),
    sortOrder: z.number().int().min(0).max(999).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

export type UpdateMenuItemInput = z.infer<typeof updateMenuItemSchema>;
