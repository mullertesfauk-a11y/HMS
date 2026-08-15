import type { NextRequest } from "next/server";

import { handleError, ok } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/request";
import { requirePermission } from "@/lib/permissions";
import { updateReservationSchema } from "@/lib/validation/reservation";
import { reservationRepository } from "@/server/repositories/reservation.repository";
import { reservationService } from "@/server/services/reservation.service";
import { hotelService } from "@/server/services/hotel.service";
import { NotFoundError } from "@/lib/errors";

/**
 * GET   /api/v1/admin/reservations/:id — full detail (guest, rooms, payments, audit)
 * PATCH /api/v1/admin/reservations/:id — edit stay dates/guests/requests
 */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/v1/admin/reservations/[id]">) {
  try {
    await requirePermission("reservations.read");
    const { id } = await ctx.params;
    const reservation = await reservationRepository.findById(id);
    if (!reservation) throw new NotFoundError("Reservation not found");
    return ok(reservation);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/v1/admin/reservations/[id]">,
) {
  try {
    const actor = await requirePermission("reservations.update");
    const { id } = await ctx.params;
    const body = await parseJsonBody(request);
    const parsed = updateReservationSchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const hotel = await hotelService.getDefaultHotel();
    const reservation = await reservationService.updateReservation(id, parsed.data, {
      taxRate: hotel.taxRate.toNumber(),
      actorId: actor.id,
    });

    return ok(reservation);
  } catch (error) {
    return handleError(error);
  }
}
