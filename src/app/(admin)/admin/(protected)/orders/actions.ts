"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/permissions";
import { OrderStatus } from "@/generated/prisma/client";
import { orderService } from "@/server/services/order.service";

/**
 * Order mutation actions for the admin UI.
 *
 * Every action re-checks the actor's permission server-side and delegates to
 * the order domain service (state machine + transaction + audit).
 */

function revalidate(orderId: string) {
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}

export interface OrderActionState {
  ok?: true;
  error?: string;
}

export async function completeOrder(orderId: string): Promise<OrderActionState> {
  try {
    const actor = await requirePermission("orders.update");
    await orderService.transitionStatus(
      orderId,
      { status: OrderStatus.COMPLETED },
      actor.id,
    );
    revalidate(orderId);
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
}

export async function cancelOrder(orderId: string): Promise<OrderActionState> {
  try {
    const actor = await requirePermission("orders.update");
    await orderService.transitionStatus(
      orderId,
      { status: OrderStatus.CANCELLED },
      actor.id,
    );
    revalidate(orderId);
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
}
