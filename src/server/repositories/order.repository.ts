import "server-only";

import { OrderStatus, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { DbClient } from "@/server/repositories/types";

/**
 * Order persistence layer. Thin — creation is a transactional domain
 * operation performed by the order service (item re-check + server pricing +
 * order + items + audit in one transaction) and is NOT exposed here as a bare
 * `create`.
 */
export const orderRepository = {
  findById<T extends Prisma.OrderInclude = typeof orderDetailInclude>(
    id: string,
    include?: T,
  ) {
    return prisma.order.findUnique({
      where: { id },
      include: (include ?? orderDetailInclude) as T,
    });
  },

  findByNumber<T extends Prisma.OrderInclude = typeof orderDetailInclude>(
    orderNumber: string,
    include?: T,
  ) {
    return prisma.order.findUnique({
      where: { orderNumber },
      include: (include ?? orderDetailInclude) as T,
    });
  },

  /** Create an order with its line items, optionally inside a transaction. */
  create(
    data: {
      orderNumber: string;
      hotelId: string;
      guestName: string;
      guestPhone: string;
      deliveryNotes?: string | null;
      status?: OrderStatus;
      subtotal: Prisma.Decimal | number;
      tax: Prisma.Decimal | number;
      total: Prisma.Decimal | number;
      currency: string;
      createdById?: string | null;
      items: {
        menuItemId: string;
        itemName: string;
        unitPrice: Prisma.Decimal | number;
        quantity: number;
        subtotal: Prisma.Decimal | number;
      }[];
    },
    db?: DbClient,
  ) {
    const client = db ?? prisma;
    return client.order.create({
      data: {
        orderNumber: data.orderNumber,
        hotelId: data.hotelId,
        guestName: data.guestName,
        guestPhone: data.guestPhone,
        deliveryNotes: data.deliveryNotes ?? null,
        status: data.status ?? OrderStatus.PLACED,
        subtotal: data.subtotal,
        tax: data.tax,
        total: data.total,
        currency: data.currency,
        createdById: data.createdById ?? null,
        items: { create: data.items },
      },
      include: orderDetailInclude,
    });
  },

  updateStatus(id: string, status: OrderStatus, db?: DbClient) {
    const client = db ?? prisma;
    return client.order.update({ where: { id }, data: { status } });
  },

  async list(params: {
    hotelId: string;
    search?: string;
    status?: OrderStatus;
    dateFrom?: Date;
    dateTo?: Date;
    skip: number;
    take: number;
    orderBy?: Prisma.OrderOrderByWithRelationInput;
  }) {
    const where: Prisma.OrderWhereInput = { hotelId: params.hotelId };

    if (params.search) {
      const term = params.search.trim();
      where.OR = [
        { orderNumber: { contains: term, mode: "insensitive" } },
        { guestName: { contains: term, mode: "insensitive" } },
        { guestPhone: { contains: term, mode: "insensitive" } },
      ];
    }
    if (params.status) where.status = params.status;
    if (params.dateFrom || params.dateTo) {
      where.createdAt = {
        ...(params.dateFrom ? { gte: params.dateFrom } : {}),
        ...(params.dateTo ? { lte: params.dateTo } : {}),
      };
    }

    const [items, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy ?? { createdAt: "desc" },
        include: orderListInclude,
      }),
      prisma.order.count({ where }),
    ]);

    return { items, total };
  },

  /** Order counts per status for a hotel (admin dashboard). */
  countByStatus(hotelId: string): Promise<Record<string, number>> {
    return prisma.order
      .groupBy({
        by: ["status"],
        where: { hotelId },
        _count: { _all: true },
      })
      .then((rows) => {
        const counts: Record<string, number> = {};
        for (const row of rows) {
          counts[row.status] = row._count._all;
        }
        return counts;
      });
  },

  /**
   * Revenue from COMPLETED orders in a window — sum of `total` per day.
   * Used by the admin dashboard/reporting.
   */
  async revenueSummary(params: { hotelId: string; from?: Date; to?: Date }) {
    const rows = await prisma.order.groupBy({
      by: ["createdAt"],
      where: {
        hotelId: params.hotelId,
        status: OrderStatus.COMPLETED,
        ...(params.from || params.to
          ? {
              createdAt: {
                ...(params.from ? { gte: params.from } : {}),
                ...(params.to ? { lte: params.to } : {}),
              },
            }
          : {}),
      },
      _sum: { total: true },
      _count: { _all: true },
      orderBy: { createdAt: "asc" },
    });

    return rows.map((row) => ({
      date: row.createdAt,
      total: row._sum.total ?? new Prisma.Decimal(0),
      count: row._count._all,
    }));
  },
};

const orderDetailInclude = {
  items: { orderBy: { id: "asc" as const } },
  auditLogs: {
    orderBy: { createdAt: "desc" as const },
    take: 10,
    include: { user: { select: { id: true, name: true, email: true } } },
  },
} satisfies Prisma.OrderInclude;

const orderListInclude = {
  items: { select: { id: true, itemName: true, quantity: true, subtotal: true } },
} satisfies Prisma.OrderInclude;
