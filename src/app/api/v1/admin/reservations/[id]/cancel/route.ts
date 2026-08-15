import type { NextRequest } from "next/server";

import { handleError, ok } from "@/lib/api/response";
import { getClientIp } from "@/lib/api/request";
import { requirePermission } from "@/lib/permissions";
import { reservationService } from "@/server/services/reservation.service";

/** POST — cancel a cancellable reservation (PENDING/CONFIRMED). */
export async function POST(_request: NextRequest, ctx: RouteContext<"/api/v1/admin/reservations/[id]/cancel">) {
  try {
    const actor = await requirePermission("reservations.cancel");
    const { id } = await ctx.params;
    const reservation = await reservationService.cancelById(id, actor.id, {
      ipAddress: getClientIp(_request),
      userAgent: _request.headers.get("user-agent") ?? undefined,
    });
    return ok(reservation);
  } catch (error) {
    return handleError(error);
  }
}
