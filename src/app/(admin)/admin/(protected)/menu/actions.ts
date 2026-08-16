"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/permissions";
import { menuService } from "@/server/services/menu.service";
import {
  createMenuCategorySchema,
  updateMenuCategorySchema,
  createMenuItemSchema,
  updateMenuItemSchema,
} from "@/lib/validation/menu";
import { z } from "zod";

/**
 * Menu mutation actions for the admin UI. Every action re-checks the actor's
 * permission server-side, validates with the shared Zod schemas, and
 * revalidates both the admin list and the public /menu page.
 */

function revalidate() {
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
}

export interface MenuActionState {
  ok?: true;
  error?: string;
}

function validationMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function createCategory(input: unknown): Promise<MenuActionState> {
  try {
    await requirePermission("menu.create");
    const parsed = createMenuCategorySchema.safeParse(input);
    if (!parsed.success) return { error: validationMessage(parsed.error) };
    await menuService.createCategory(parsed.data);
    revalidate();
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
}

export async function updateCategory(
  categoryId: string,
  input: unknown,
): Promise<MenuActionState> {
  try {
    await requirePermission("menu.update");
    const parsed = updateMenuCategorySchema.safeParse(input);
    if (!parsed.success) return { error: validationMessage(parsed.error) };
    await menuService.updateCategory(categoryId, parsed.data);
    revalidate();
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
}

export async function deleteCategory(categoryId: string): Promise<MenuActionState> {
  try {
    await requirePermission("menu.delete");
    await menuService.deleteCategory(categoryId);
    revalidate();
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
}

// ---------------------------------------------------------------------------
// Items
// ---------------------------------------------------------------------------

export async function createItem(input: unknown): Promise<MenuActionState> {
  try {
    await requirePermission("menu.create");
    const parsed = createMenuItemSchema.safeParse(input);
    if (!parsed.success) return { error: validationMessage(parsed.error) };
    await menuService.createItem(parsed.data);
    revalidate();
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
}

export async function updateItem(
  itemId: string,
  input: unknown,
): Promise<MenuActionState> {
  try {
    await requirePermission("menu.update");
    const parsed = updateMenuItemSchema.safeParse(input);
    if (!parsed.success) return { error: validationMessage(parsed.error) };
    await menuService.updateItem(itemId, parsed.data);
    revalidate();
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
}

export async function deleteItem(itemId: string): Promise<MenuActionState> {
  try {
    await requirePermission("menu.delete");
    await menuService.deleteItem(itemId);
    revalidate();
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
}
