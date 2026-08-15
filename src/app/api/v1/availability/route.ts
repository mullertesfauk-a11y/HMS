import type { NextRequest } from "next/server";

import { handleError, ok } from "@/lib/api/response";
import { hotelDateToUtc } from "@/lib/dates";
import { availabilityQuerySchema } from "@/lib/validation/availability";
import { availabilityService } from "@/server/services/availability.service";
import { hotelService } from "@/server/services/hotel.service";

/**
 * GET /api/v1/availability?checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD&adults=2&children=1
 *
 * Returns bookable room types with server-computed pricing for the stay.
 * Dates are validated on the server; availability is computed from the DB.
 */
export async function GET(request: NextRequest) {
  try {
    const query = Object.fromEntries(request.nextUrl.searchParams);
    const parsed = availabilityQuerySchema.safeParse(query);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const hotel = await hotelService.getDefaultHotel();
    const results = await availabilityService.searchAvailability({
      hotelId: hotel.id,
      checkIn: hotelDateToUtc(parsed.data.checkIn)!,
      checkOut: hotelDateToUtc(parsed.data.checkOut)!,
      adults: parsed.data.adults,
      children: parsed.data.children,
      // Show the hotel's configured tax in quoted prices.
      taxRate: hotel.taxRate.toNumber(),
    });

    return ok(results);
  } catch (error) {
    return handleError(error);
  }
}
