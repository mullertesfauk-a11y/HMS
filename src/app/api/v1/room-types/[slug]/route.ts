import { handleError, ok } from "@/lib/api/response";
import { hotelService } from "@/server/services/hotel.service";

/**
 * GET /api/v1/room-types/:slug
 * Public room type detail (active types only, sanitized view).
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/v1/room-types/[slug]">) {
  try {
    const { slug } = await ctx.params;
    const roomType = await hotelService.getRoomTypeBySlug(slug);
    return ok(roomType);
  } catch (error) {
    return handleError(error);
  }
}
