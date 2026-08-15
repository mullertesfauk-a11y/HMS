import { handleError, ok } from "@/lib/api/response";
import { hotelService } from "@/server/services/hotel.service";

/**
 * GET /api/v1/room-types
 * Public room type listing (active types only, sanitized view).
 */
export async function GET() {
  try {
    const roomTypes = await hotelService.getRoomTypes();
    return ok(roomTypes);
  } catch (error) {
    return handleError(error);
  }
}
