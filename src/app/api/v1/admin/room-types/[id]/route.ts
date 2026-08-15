import type { NextRequest } from "next/server";

import { handleError, ok, noContent } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/request";
import { NotFoundError } from "@/lib/errors";
import { requirePermission } from "@/lib/permissions";
import { updateRoomTypeSchema } from "@/lib/validation/room-type";
import { roomTypeRepository } from "@/server/repositories/room-type.repository";
import { roomTypeService } from "@/server/services/room-type.service";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/v1/admin/room-types/[id]">) {
  try {
    await requirePermission("roomTypes.read");
    const { id } = await ctx.params;
    const roomType = await roomTypeRepository.findById(id);
    if (!roomType) throw new NotFoundError("Room type not found");
    return ok(roomType);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/v1/admin/room-types/[id]">,
) {
  try {
    await requirePermission("roomTypes.update");
    const { id } = await ctx.params;
    const body = await parseJsonBody(request);
    const parsed = updateRoomTypeSchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }
    const roomType = await roomTypeService.update(id, parsed.data);
    return ok(roomType);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/v1/admin/room-types/[id]">) {
  try {
    await requirePermission("roomTypes.delete");
    const { id } = await ctx.params;
    await roomTypeService.delete(id);
    return noContent();
  } catch (error) {
    return handleError(error);
  }
}
