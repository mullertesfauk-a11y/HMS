import type { NextRequest } from "next/server";

import { parseJsonBody, getClientIp } from "@/lib/api/request";
import { created, handleError } from "@/lib/api/response";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createOrderSchema } from "@/lib/validation/order";
import { orderService } from "@/server/services/order.service";
import { hotelService } from "@/server/services/hotel.service";
import { toPublicOrderView } from "@/server/services/order.view";

/**
 * POST /api/v1/orders
 *
 * Creates a food order as one transactional domain operation: menu item
 * re-check, server-side pricing, order number, snapshot line items, and an
 * audit entry. Client-provided totals are never trusted.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    await enforceRateLimit(`orders:create:${ip}`, { limit: 10, windowMs: 60_000 });

    const body = await parseJsonBody(request);
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const hotel = await hotelService.getDefaultHotel();
    const order = await orderService.createOrder(parsed.data, {
      hotelId: hotel.id,
      currency: hotel.currency,
      taxRate: hotel.taxRate.toNumber(),
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return created(toPublicOrderView(order));
  } catch (error) {
    return handleError(error);
  }
}
