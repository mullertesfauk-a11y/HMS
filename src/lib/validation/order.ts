import { z } from "zod";

import { OrderStatus } from "@/generated/prisma/client";

/**
 * Order schemas.
 *
 * Note: no price/total fields are accepted — the server always recalculates
 * pricing from the menu item prices and quantities (see
 * src/lib/domain/pricing.ts → calculateOrderPricing).
 */

export const orderItemSchema = z.object({
  /** Public menu item slug — never internal ids from the client. */
  slug: z.string().trim().min(1, "Menu item is required").max(100),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(20),
});

export const createOrderSchema = z.object({
  guestName: z.string().trim().min(1, "Name is required").max(100),
  guestPhone: z.string().trim().min(1, "Phone number is required").max(50),
  deliveryNotes: z.string().trim().max(2000).optional(),
  items: z.array(orderItemSchema).min(1, "Order must contain at least one item").max(50),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

/** Public lookup uses orderNumber + guestPhone for privacy. */
export const orderLookupSchema = z.object({
  orderNumber: z.string().trim().min(1, "Order number is required").max(30),
  guestPhone: z.string().trim().min(1, "Phone number is required").max(50),
});

export type OrderLookupInput = z.infer<typeof orderLookupSchema>;

/** Admin/staff status transition. */
export const updateOrderStatusSchema = z.object({
  status: z.enum([OrderStatus.PLACED, OrderStatus.COMPLETED, OrderStatus.CANCELLED]),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
