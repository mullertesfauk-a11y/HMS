import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { DbClient } from "@/server/repositories/types";

/**
 * Guest persistence layer. Kept thin — all business rules live in services.
 */
export const guestRepository = {
  findById(id: string, db?: DbClient) {
    const client = db ?? prisma;
    return client.guest.findUnique({ where: { id } });
  },

  findByEmail(email: string, db?: DbClient) {
    const client = db ?? prisma;
    return client.guest.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
  },

  /**
   * Find a guest by email, creating one when no match exists. Accepts a
   * transaction client so reservation creation can run it atomically.
   */
  async findOrCreate(
    data: {
      email?: string | null;
      firstName: string;
      lastName: string;
      phone?: string | null;
      country?: string | null;
      specialNotes?: string | null;
    },
    db?: DbClient,
  ) {
    const client = db ?? prisma;
    if (data.email) {
      const existing = await this.findByEmail(data.email, client);
      if (existing) return existing;
    }
    return client.guest.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email ?? null,
        phone: data.phone ?? null,
        country: data.country ?? null,
        specialNotes: data.specialNotes ?? null,
      },
    });
  },

  async list(params: {
    search?: string;
    skip: number;
    take: number;
    orderBy?: Prisma.GuestOrderByWithRelationInput;
  }) {
    const where: Prisma.GuestWhereInput = {};
    if (params.search) {
      const term = params.search.trim();
      where.OR = [
        { firstName: { contains: term, mode: "insensitive" } },
        { lastName: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { phone: { contains: term, mode: "insensitive" } },
      ];
    }

    const [items, total] = await prisma.$transaction([
      prisma.guest.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy ?? { createdAt: "desc" },
        include: {
          _count: { select: { reservations: true } },
          reservations: {
            orderBy: { checkIn: "desc" },
            take: 1,
            select: {
              id: true,
              reservationNumber: true,
              checkIn: true,
              checkOut: true,
              status: true,
            },
          },
        },
      }),
      prisma.guest.count({ where }),
    ]);

    return { items, total };
  },

  update(id: string, data: Prisma.GuestUpdateInput) {
    return prisma.guest.update({ where: { id }, data });
  },
};
