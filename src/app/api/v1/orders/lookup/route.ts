import type { NextRequest } from "next/server";

import { parseJsonBody, getClientIp } from "@/lib/api/request";
import { ok, handleError } from "@/lib/api/response";
import { enforceRateLimit } from "@/lib/rate-limit";
import { orderLookupSchema } from "@/lib/validation/order";
import { orderService } from "@/server/services/order.service";
import { toPublicOrderView } from "@/server/services/order.view";

/**
 * POST /api/v1/orders/lookup
 *
 * Public lookup by order number + guest phone (privacy gate). Returns a
 * sanitized order view; does not reveal whether an order exists on mismatch.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    await enforceRateLimit(`orders:lookup:${ip}`, { limit: 20, windowMs: 60_000 });

    const body = await parseJsonBody(request);
    const parsed = orderLookupSchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const order = await orderService.lookup(parsed.data);
    return ok(toPublicOrderView(order));
  } catch (error) {
    return handleError(error);
  }
}
