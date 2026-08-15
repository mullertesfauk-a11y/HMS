import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

/**
 * Payment persistence layer. Payment provider integrations plug in later via
 * the payment service — this repository only persists payment records.
 */
export const paymentRepository = {
  findById(id: string) {
    return prisma.payment.findUnique({ where: { id } });
  },

  findByReservation(reservationId: string) {
    return prisma.payment.findMany({
      where: { reservationId },
      orderBy: { createdAt: "desc" },
    });
  },

  create(data: Prisma.PaymentUncheckedCreateInput) {
    return prisma.payment.create({ data });
  },

  update(id: string, data: Prisma.PaymentUncheckedUpdateInput) {
    return prisma.payment.update({ where: { id }, data });
  },
};
