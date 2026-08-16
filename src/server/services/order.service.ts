import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { calculateOrderPricing } from "@/lib/domain/pricing";
import { generateReservationNumber } from "@/lib/domain/reservation-number";
import { transitionOrderStatus } from "@/lib/domain/order-status";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type {
  CreateOrderInput,
  OrderLookupInput,
  UpdateOrderStatusInput,
} from "@/lib/validation/order";
import { auditRepository } from "@/server/repositories/audit.repository";
import { menuRepository } from "@/server/repositories/menu.repository";
import { orderRepository } from "@/server/repositories/order.repository";
import type { DbClient } from "@/server/repositories/types";

/**
 * Order domain service — the CENTRAL entry point for every order operation
 * from any client (public website, admin portal, future mobile app).
 *
 * `createOrder` is a single DB transaction (mirrors `reservationService`):
 *   1. menu items re-read by slug INSIDE the transaction (source of truth)
 *   2. availability checks: item must exist, be available, and its category active
 *   3. server-side pricing (never trust client totals)
 *   4. unique order number, Order + snapshot OrderItem lines, audit entry
 *   5. structured log event
 *
 * Status changes go through the state machine in src/lib/domain/order-status.ts.
 */

const DETAIL_INCLUDE = {
  items: { orderBy: { id: "asc" as const } },
  auditLogs: {
    orderBy: { createdAt: "desc" as const },
    take: 10,
    include: { user: { select: { id: true, name: true, email: true } } },
  },
} satisfies Prisma.OrderInclude;

export type OrderWithDetails = Prisma.OrderGetPayload<{
  include: typeof DETAIL_INCLUDE;
}>;

export interface OrderServiceContext {
  hotelId: string;
  currency: string;
  taxRate: number;
  /** When the order is placed by staff from the admin portal. */
  createdById?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
}

/** Line subtotal in minor units → major units, avoiding float drift. */
function lineSubtotal(unitPrice: number, quantity: number): number {
  return Math.round(unitPrice * 100 * quantity) / 100;
}

export class OrderService {
  /**
   * Create an order from any client. Returns the created order (with items).
   * Throws NotFoundError when an item slug is unknown, ConflictError when an
   * item is unavailable or its category is inactive.
   */
  async createOrder(
    input: CreateOrderInput,
    context: OrderServiceContext,
  ): Promise<OrderWithDetails> {
    const order = await prisma.$transaction(
      async (tx) => {
        // 1. Re-read items by slug inside the transaction (source of truth).
        const slugs = [...new Set(input.items.map((line) => line.slug))];
        const items = await menuRepository.findItemsBySlugs(context.hotelId, slugs, tx);
        const bySlug = new Map(items.map((item) => [item.slug, item]));

        const lines = input.items.map((line) => {
          const item = bySlug.get(line.slug);
          if (!item) {
            throw new NotFoundError(`Menu item not found: ${line.slug}`);
          }
          if (!item.isAvailable) {
            throw new ConflictError(`${item.name} is currently unavailable`);
          }
          if (!item.category.isActive) {
            throw new ConflictError(`${item.name} is no longer on the menu`);
          }
          return { item, quantity: line.quantity };
        });

        // 2. Server-side pricing.
        const pricing = calculateOrderPricing(
          lines.map((line) => ({
            unitPrice: line.item.price.toNumber(),
            quantity: line.quantity,
          })),
          context.taxRate,
        );

        // 3. Human-friendly unique order number.
        const orderNumber = await this.generateUniqueOrderNumber(tx);

        // 4. Order + snapshot line items + audit entry, all in one transaction.
        const created = await orderRepository.create(
          {
            orderNumber,
            hotelId: context.hotelId,
            guestName: input.guestName,
            guestPhone: input.guestPhone,
            deliveryNotes: input.deliveryNotes,
            subtotal: pricing.subtotal,
            tax: pricing.tax,
            total: pricing.total,
            currency: context.currency,
            createdById: context.createdById,
            items: lines.map((line) => ({
              menuItemId: line.item.id,
              itemName: line.item.name,
              unitPrice: line.item.price.toNumber(),
              quantity: line.quantity,
              subtotal: lineSubtotal(line.item.price.toNumber(), line.quantity),
            })),
          },
          tx,
        );

        await auditRepository.log({
          action: "order.created",
          entity: "order",
          entityId: created.id,
          orderId: created.id,
          userId: context.createdById,
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
          newData: {
            orderNumber,
            status: created.status,
            itemCount: lines.length,
            total: pricing.total,
            currency: context.currency,
          },
          db: tx,
        });

        return created;
      },
      { maxWait: 10_000, timeout: 20_000 },
    );

    logger.info("order.created", {
      orderNumber: order.orderNumber,
      hotelId: context.hotelId,
      itemCount: order.items.length,
      total: order.total,
    });

    return order;
  }

  /**
   * Public lookup: order number + guest phone (privacy gate). Returns the
   * internal entity — callers map it with the public view.
   */
  async lookup(input: OrderLookupInput): Promise<OrderWithDetails> {
    const order = await orderRepository.findByNumber(input.orderNumber.trim());
    if (!order || order.guestPhone.trim() !== input.guestPhone.trim()) {
      // Do not reveal whether the order exists.
      throw new NotFoundError("Order not found");
    }
    return order;
  }

  /** Admin/staff list with search, status and date filters. */
  listOrders(params: {
    hotelId: string;
    search?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    skip: number;
    take: number;
    orderBy?: Prisma.OrderOrderByWithRelationInput;
  }) {
    return orderRepository.list({
      hotelId: params.hotelId,
      search: params.search,
      status: params.status as Parameters<typeof orderRepository.list>[0]["status"],
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      skip: params.skip,
      take: params.take,
      orderBy: params.orderBy,
    });
  }

  async getOrder(orderId: string): Promise<OrderWithDetails> {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");
    return order;
  }

  /** State-machine-guarded status transition with audit + log, in one transaction. */
  async transitionStatus(
    orderId: string,
    input: UpdateOrderStatusInput,
    actorId?: string,
    meta?: RequestMeta,
  ): Promise<OrderWithDetails> {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");

    // Validates the transition and throws InvalidOrderStateError.
    transitionOrderStatus(order.status, input.status);

    const action = `order.${input.status.toLowerCase()}`;

    const updated = await prisma.$transaction(
      async (tx) => {
        await orderRepository.updateStatus(orderId, input.status, tx);

        await auditRepository.log({
          action,
          entity: "order",
          entityId: orderId,
          orderId,
          userId: actorId,
          ipAddress: meta?.ipAddress,
          userAgent: meta?.userAgent,
          oldData: { status: order.status },
          newData: { status: input.status },
          db: tx,
        });

        return tx.order.findUniqueOrThrow({
          where: { id: orderId },
          include: DETAIL_INCLUDE,
        });
      },
      { maxWait: 10_000, timeout: 20_000 },
    );

    logger.info(action, {
      orderId,
      orderNumber: order.orderNumber,
      from: order.status,
      to: input.status,
    });

    return updated;
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private async generateUniqueOrderNumber(db: DbClient): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateReservationNumber("ORD");
      const existing = await db.order.findUnique({
        where: { orderNumber: candidate },
        select: { id: true },
      });
      if (!existing) return candidate;
    }
    throw new ConflictError("Could not generate a unique order number");
  }
}

export const orderService = new OrderService();
