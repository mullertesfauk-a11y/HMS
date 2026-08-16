import type { NextRequest } from "next/server";

import { handleError, ok, noContent } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/request";
import { NotFoundError } from "@/lib/errors";
import { requirePermission } from "@/lib/permissions";
import { updateMenuItemSchema } from "@/lib/validation/menu";
import { menuRepository } from "@/server/repositories/menu.repository";
import { menuService } from "@/server/services/menu.service";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/v1/admin/menu/items/[id]">) {
  try {
    await requirePermission("menu.read");
    const { id } = await ctx.params;
    const item = await menuRepository.findItemById(id);
    if (!item) throw new NotFoundError("Menu item not found");
    return ok(item);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/v1/admin/menu/items/[id]">,
) {
  try {
    await requirePermission("menu.update");
    const { id } = await ctx.params;
    const body = await parseJsonBody(request);
    const parsed = updateMenuItemSchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }
    const item = await menuService.updateItem(id, parsed.data);
    return ok(item);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/v1/admin/menu/items/[id]">,
) {
  try {
    await requirePermission("menu.delete");
    const { id } = await ctx.params;
    await menuService.deleteItem(id);
    return noContent();
  } catch (error) {
    return handleError(error);
  }
}
