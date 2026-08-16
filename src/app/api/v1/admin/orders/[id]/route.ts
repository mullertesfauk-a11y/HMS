import type { NextRequest } from "next/server";

import { handleError, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/permissions";
import { orderService } from "@/server/services/order.service";

/** GET /api/v1/admin/orders/:id — full order detail with items + audit trail. */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/v1/admin/orders/[id]">) {
  try {
    await requirePermission("orders.read");
    const { id } = await ctx.params;
    const order = await orderService.getOrder(id);
    return ok(order);
  } catch (error) {
    return handleError(error);
  }
}
