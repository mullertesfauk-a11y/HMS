import type { NextRequest } from "next/server";

import { handleError, ok } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/request";
import { requirePermission } from "@/lib/permissions";
import { z } from "zod";
import { reservationService } from "@/server/services/reservation.service";

const assignRoomSchema = z.object({
  roomId: z.string().cuid(),
});

/** POST — assign a physical room to a pending/confirmed reservation. */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/v1/admin/reservations/[id]/assign-room">) {
  try {
    const actor = await requirePermission("reservations.update");
    const { id } = await ctx.params;
    const body = await parseJsonBody(request);
    const parsed = assignRoomSchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }
    const reservation = await reservationService.assignRoom(id, parsed.data.roomId, actor.id);
    return ok(reservation);
  } catch (error) {
    return handleError(error);
  }
}
