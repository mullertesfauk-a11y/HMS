import type { NextRequest } from "next/server";

import { parseJsonBody, getClientIp } from "@/lib/api/request";
import { created, handleError } from "@/lib/api/response";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createReservationSchema } from "@/lib/validation/reservation";
import { reservationService } from "@/server/services/reservation.service";
import { hotelService } from "@/server/services/hotel.service";
import { toPublicReservationView } from "@/server/services/reservation.view";

/**
 * POST /api/v1/reservations
 *
 * Creates a reservation as one transactional domain operation: availability
 * re-check, guest find-or-create, server-side pricing, reservation number,
 * room-type line, and a PENDING payment record. Client-provided totals are
 * never trusted.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    await enforceRateLimit(`reservations:create:${ip}`, { limit: 10, windowMs: 60_000 });

    const body = await parseJsonBody(request);
    const parsed = createReservationSchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const hotel = await hotelService.getDefaultHotel();
    const reservation = await reservationService.createReservation(parsed.data, {
      hotelId: hotel.id,
      currency: hotel.currency,
      taxRate: hotel.taxRate.toNumber(),
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return created(toPublicReservationView(reservation));
  } catch (error) {
    return handleError(error);
  }
}
