import { handleError, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/permissions";
import { dashboardService } from "@/server/services/dashboard.service";
import { hotelService } from "@/server/services/hotel.service";

/**
 * GET /api/v1/admin/dashboard
 * Operational metrics: today's arrivals/departures, occupancy, available
 * rooms, pending/confirmed counts, and in-house revenue.
 */
export async function GET() {
  try {
    await requirePermission("dashboard.view");
    const hotel = await hotelService.getDefaultHotel();
    const metrics = await dashboardService.getMetrics(hotel.id, new Date(), hotel.currency);
    return ok(metrics);
  } catch (error) {
    return handleError(error);
  }
}
