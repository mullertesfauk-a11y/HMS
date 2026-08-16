import type { NextRequest } from "next/server";

import { handleError, ok, noContent } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/request";
import { requirePermission } from "@/lib/permissions";
import { updateMenuCategorySchema } from "@/lib/validation/menu";
import { menuService } from "@/server/services/menu.service";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/v1/admin/menu/categories/[id]">,
) {
  try {
    await requirePermission("menu.update");
    const { id } = await ctx.params;
    const body = await parseJsonBody(request);
    const parsed = updateMenuCategorySchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }
    const category = await menuService.updateCategory(id, parsed.data);
    return ok(category);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/v1/admin/menu/categories/[id]">,
) {
  try {
    await requirePermission("menu.delete");
    const { id } = await ctx.params;
    await menuService.deleteCategory(id);
    return noContent();
  } catch (error) {
    return handleError(error);
  }
}
