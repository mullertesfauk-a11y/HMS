import type { NextRequest } from "next/server";

import { getClientIp, parseJsonBody } from "@/lib/api/request";
import { handleError, ok } from "@/lib/api/response";
import { ValidationError } from "@/lib/errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { cancelReservationSchema } from "@/lib/validation/reservation";
import { reservationService } from "@/server/services/reservation.service";
import { toPublicReservationView } from "@/server/services/reservation.view";

/**
 * POST /api/v1/reservations/:reservationNumber/cancel
 *
 * Public cancellation by reservation number (URL) + guest last name (body).
 * Only cancellable states (PENDING / CONFIRMED) may be cancelled.
 */
export async function POST(
  request: NextRequest,
  ctx: RouteContext<"/api/v1/reservations/[reservationNumber]/cancel">,
) {
  try {
    const ip = getClientIp(request);
    await enforceRateLimit(`reservations:cancel:${ip}`, { limit: 10, windowMs: 60_000 });

    const { reservationNumber } = await ctx.params;
    const body = await parseJsonBody(request);
    const parsed = cancelReservationSchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }
    if (parsed.data.reservationNumber !== reservationNumber) {
      // Defensive: the URL and body must agree on the reservation number.
      return handleError(new ValidationError("Reservation number mismatch"));
    }

    const reservation = await reservationService.cancelPublic(parsed.data, {
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return ok(toPublicReservationView(reservation));
  } catch (error) {
    return handleError(error);
  }
}
