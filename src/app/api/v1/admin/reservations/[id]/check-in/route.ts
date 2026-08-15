import type { NextRequest } from "next/server";

import { handleError, ok } from "@/lib/api/response";
import { getClientIp } from "@/lib/api/request";
import { requirePermission } from "@/lib/permissions";
import { reservationService } from "@/server/services/reservation.service";

/** POST — check in a CONFIRMED reservation. */
export async function POST(_request: NextRequest, ctx: RouteContext<"/api/v1/admin/reservations/[id]/check-in">) {
  try {
    const actor = await requirePermission("reservations.checkin");
    const { id } = await ctx.params;
    const reservation = await reservationService.checkIn(id, actor.id, {
      ipAddress: getClientIp(_request),
      userAgent: _request.headers.get("user-agent") ?? undefined,
    });
    return ok(reservation);
  } catch (error) {
    return handleError(error);
  }
}
