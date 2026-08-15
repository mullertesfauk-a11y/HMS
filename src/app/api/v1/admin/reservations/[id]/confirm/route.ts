import type { NextRequest } from "next/server";

import { handleError, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/permissions";
import { reservationService } from "@/server/services/reservation.service";

/** POST — confirm a PENDING reservation. */
export async function POST(_request: NextRequest, ctx: RouteContext<"/api/v1/admin/reservations/[id]/confirm">) {
  try {
    const actor = await requirePermission("reservations.confirm");
    const { id } = await ctx.params;
    const reservation = await reservationService.confirm(id, actor.id);
    return ok(reservation);
  } catch (error) {
    return handleError(error);
  }
}
