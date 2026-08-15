import type { NextRequest } from "next/server";

import { getClientIp, parseJsonBody } from "@/lib/api/request";
import { handleError, ok } from "@/lib/api/response";
import { enforceRateLimit } from "@/lib/rate-limit";
import { reservationLookupSchema } from "@/lib/validation/reservation";
import { reservationService } from "@/server/services/reservation.service";
import { toPublicReservationView } from "@/server/services/reservation.view";

/**
 * POST /api/v1/reservations/lookup
 *
 * Public lookup by reservation number + guest last name (privacy gate).
 * Returns the sanitized reservation view.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    await enforceRateLimit(`reservations:lookup:${ip}`, { limit: 20, windowMs: 60_000 });

    const body = await parseJsonBody(request);
    const parsed = reservationLookupSchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const reservation = await reservationService.lookup(parsed.data);
    return ok(toPublicReservationView(reservation));
  } catch (error) {
    return handleError(error);
  }
}
