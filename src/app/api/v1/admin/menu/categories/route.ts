import type { NextRequest } from "next/server";

import { handleError, ok, created } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/request";
import { requirePermission } from "@/lib/permissions";
import { createMenuCategorySchema } from "@/lib/validation/menu";
import { menuService } from "@/server/services/menu.service";

/** GET /api/v1/admin/menu/categories — all categories with item counts. */
export async function GET() {
  try {
    await requirePermission("menu.read");
    const categories = await menuService.listCategories();
    return ok(categories);
  } catch (error) {
    return handleError(error);
  }
}

/** POST /api/v1/admin/menu/categories — create a category (menu.create). */
export async function POST(request: NextRequest) {
  try {
    await requirePermission("menu.create");
    const body = await parseJsonBody(request);
    const parsed = createMenuCategorySchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }
    const category = await menuService.createCategory(parsed.data);
    return created(category);
  } catch (error) {
    return handleError(error);
  }
}
