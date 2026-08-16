import type { NextRequest } from "next/server";

import { handleError, ok } from "@/lib/api/response";
import { parseJsonBody, getClientIp } from "@/lib/api/request";
import { requirePermission } from "@/lib/permissions";
import { updateOrderStatusSchema } from "@/lib/validation/order";
import { orderService } from "@/server/services/order.service";

/**
 * POST /api/v1/admin/orders/:id/status — transition an order's status
 * (orders.update). Transitions are validated by the order state machine.
 */
export async function POST(request: NextRequest, ctx: RouteContext<"/api/v1/admin/orders/[id]/status">) {
  try {
    const actor = await requirePermission("orders.update");
    const { id } = await ctx.params;

    const body = await parseJsonBody(request);
    const parsed = updateOrderStatusSchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    const order = await orderService.transitionStatus(id, parsed.data, actor.id, {
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return ok(order);
  } catch (error) {
    return handleError(error);
  }
}
