import "server-only";

import { OrderStatus } from "@/generated/prisma/client";

import { InvalidOrderStateError } from "@/lib/errors";

/**
 * Order state machine.
 *
 * The ONLY place order status transitions are defined. Services must call
 * `transitionOrderStatus` instead of assigning status freely.
 *
 * Valid transitions:
 *   PLACED    → COMPLETED, CANCELLED
 *   COMPLETED → (terminal)
 *   CANCELLED → (terminal)
 *
 * Orders are settled offline (pay on delivery / at the counter), so a placed
 * order is not yet paid — staff mark it COMPLETED once the guest has settled.
 */

export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.PLACED]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

export function canTransitionOrderStatus(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Statuses staff may still act on. */
export const OPEN_ORDER_STATUSES: readonly OrderStatus[] = [OrderStatus.PLACED];

/** Validate a transition; returns the target status on success and throws InvalidOrderStateError otherwise. */
export function transitionOrderStatus(
  from: OrderStatus,
  to: OrderStatus,
): OrderStatus {
  if (!canTransitionOrderStatus(from, to)) {
    throw new InvalidOrderStateError(
      `Cannot transition order from ${from} to ${to}`,
    );
  }
  return to;
}
