import { handleError, ok } from "@/lib/api/response";
import { hotelService } from "@/server/services/hotel.service";

/**
 * GET /api/v1/hotel
 * Public hotel information (sanitized view).
 */
export async function GET() {
  try {
    const hotel = await hotelService.getPublicHotel();
    return ok(hotel);
  } catch (error) {
    return handleError(error);
  }
}
