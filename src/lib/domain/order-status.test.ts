import { describe, expect, it } from "vitest";

import { OrderStatus } from "@/generated/prisma/client";
import { InvalidOrderStateError } from "@/lib/errors";
import {
  canTransitionOrderStatus,
  OPEN_ORDER_STATUSES,
  transitionOrderStatus,
} from "@/lib/domain/order-status";

describe("order status state machine", () => {
  it("allows PLACED → COMPLETED and PLACED → CANCELLED", () => {
    expect(canTransitionOrderStatus(OrderStatus.PLACED, OrderStatus.COMPLETED)).toBe(true);
    expect(canTransitionOrderStatus(OrderStatus.PLACED, OrderStatus.CANCELLED)).toBe(true);
  });

  it("treats COMPLETED and CANCELLED as terminal", () => {
    expect(transitionOrderStatus(OrderStatus.PLACED, OrderStatus.COMPLETED)).toBe(OrderStatus.COMPLETED);
    for (const terminal of [OrderStatus.COMPLETED, OrderStatus.CANCELLED]) {
      for (const target of Object.values(OrderStatus)) {
        expect(canTransitionOrderStatus(terminal, target)).toBe(false);
      }
    }
  });

  it("rejects every other transition", () => {
    expect(canTransitionOrderStatus(OrderStatus.COMPLETED, OrderStatus.CANCELLED)).toBe(false);
    expect(canTransitionOrderStatus(OrderStatus.CANCELLED, OrderStatus.COMPLETED)).toBe(false);
    expect(canTransitionOrderStatus(OrderStatus.COMPLETED, OrderStatus.PLACED)).toBe(false);
    expect(canTransitionOrderStatus(OrderStatus.CANCELLED, OrderStatus.PLACED)).toBe(false);
  });

  it("throws InvalidOrderStateError on invalid transitions", () => {
    expect(() =>
      transitionOrderStatus(OrderStatus.COMPLETED, OrderStatus.CANCELLED),
    ).toThrow(InvalidOrderStateError);
    expect(() =>
      transitionOrderStatus(OrderStatus.CANCELLED, OrderStatus.PLACED),
    ).toThrow(InvalidOrderStateError);
  });

  it("exposes only PLACED as an open status", () => {
    expect(OPEN_ORDER_STATUSES).toEqual([OrderStatus.PLACED]);
  });
});
