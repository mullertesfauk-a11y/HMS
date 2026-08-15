import type { NextRequest } from "next/server";

import { handleError, ok, noContent } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/request";
import { NotFoundError } from "@/lib/errors";
import { requirePermission } from "@/lib/permissions";
import { updateRoomSchema } from "@/lib/validation/room";
import { roomRepository } from "@/server/repositories/room.repository";
import { roomService } from "@/server/services/room.service";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/v1/admin/rooms/[id]">) {
  try {
    await requirePermission("rooms.read");
    const { id } = await ctx.params;
    const room = await roomRepository.findById(id);
    if (!room) throw new NotFoundError("Room not found");
    return ok(room);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/v1/admin/rooms/[id]">,
) {
  try {
    await requirePermission("rooms.update");
    const { id } = await ctx.params;
    const body = await parseJsonBody(request);
    const parsed = updateRoomSchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }
    const room = await roomService.update(id, parsed.data);
    return ok(room);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: NextRequest, ctx: RouteContext<"/api/v1/admin/rooms/[id]">) {
  try {
    await requirePermission("rooms.delete");
    const { id } = await ctx.params;
    await roomService.delete(id);
    return noContent();
  } catch (error) {
    return handleError(error);
  }
}
