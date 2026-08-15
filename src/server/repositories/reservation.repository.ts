import "server-only";

import { Prisma, ReservationStatus } from "@/generated/prisma/client";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/domain/reservation-status";
import { prisma } from "@/lib/db/prisma";
import type { DbClient } from "@/server/repositories/types";

/**
 * Reservation persistence layer.
 *
 * Creation is a transactional domain operation performed by the reservation
 * service (availability re-check + guest + reservation + rooms + payment in
 * one transaction) — it is NOT exposed here as a bare `create`.
 */
export const reservationRepository = {
  findById<T extends Prisma.ReservationInclude = typeof reservationDetailInclude>(
    id: string,
    include?: T,
  ) {
    return prisma.reservation.findUnique({
      where: { id },
      include: (include ?? reservationDetailInclude) as T,
    });
  },

  findByNumber<T extends Prisma.ReservationInclude = typeof reservationDetailInclude>(
    reservationNumber: string,
    include?: T,
  ) {
    return prisma.reservation.findUnique({
      where: { reservationNumber },
      include: (include ?? reservationDetailInclude) as T,
    });
  },

  async list(params: {
    hotelId: string;
    search?: string;
    status?: ReservationStatus;
    /** Only reservations whose stay intersects [checkInFrom, checkInTo]. */
    checkInFrom?: Date;
    checkInTo?: Date;
    /** Only reservations whose departure falls in [checkOutFrom, checkOutTo]. */
    checkOutFrom?: Date;
    checkOutTo?: Date;
    roomTypeId?: string;
    paymentStatus?: string;
    skip: number;
    take: number;
    orderBy?: Prisma.ReservationOrderByWithRelationInput;
  }) {
    const where: Prisma.ReservationWhereInput = { hotelId: params.hotelId };

    if (params.search) {
      const term = params.search.trim();
      where.OR = [
        { reservationNumber: { contains: term, mode: "insensitive" } },
        { guest: { OR: [
          { firstName: { contains: term, mode: "insensitive" } },
          { lastName: { contains: term, mode: "insensitive" } },
          { email: { contains: term, mode: "insensitive" } },
        ] } },
      ];
    }
    if (params.status) where.status = params.status;
    if (params.checkInFrom || params.checkInTo) {
      where.checkIn = {
        ...(params.checkInFrom ? { gte: params.checkInFrom } : {}),
        ...(params.checkInTo ? { lte: params.checkInTo } : {}),
      };
    }
    if (params.checkOutFrom || params.checkOutTo) {
      where.checkOut = {
        ...(params.checkOutFrom ? { gte: params.checkOutFrom } : {}),
        ...(params.checkOutTo ? { lte: params.checkOutTo } : {}),
      };
    }
    if (params.roomTypeId) {
      where.rooms = { some: { roomTypeId: params.roomTypeId } };
    }
    if (params.paymentStatus) {
      where.payments = { some: { status: params.paymentStatus as Prisma.EnumPaymentStatusFilter["equals"] } };
    }

    const [items, total] = await prisma.$transaction([
      prisma.reservation.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy ?? { createdAt: "desc" },
        include: reservationListInclude,
      }),
      prisma.reservation.count({ where }),
    ]);

    return { items, total };
  },

  /**
   * Overlapping active reservations for the given room(s) and date range.
   * Kept for admin use; availability logic uses the grouped methods below.
   */
  findOverlappingByRooms(params: {
    hotelId: string;
    roomIds: string[];
    checkIn: Date;
    checkOut: Date;
    excludeReservationId?: string;
  }) {
    return prisma.reservation.findMany({
      where: {
        hotelId: params.hotelId,
        status: { in: [...ACTIVE_BOOKING_STATUSES] },
        ...(params.excludeReservationId
          ? { id: { not: params.excludeReservationId } }
          : {}),
        rooms: {
          some: {
            roomId: { in: params.roomIds },
            reservation: {
              checkIn: { lt: params.checkOut },
              checkOut: { gt: params.checkIn },
            },
          },
        },
      },
      select: { id: true, reservationNumber: true, checkIn: true, checkOut: true },
    });
  },

  /**
   * Overlapping ReservationRoom rows for a hotel's room types, grouped by
   * roomTypeId. Counts BOTH assigned and unassigned reservations: an assigned
   * reservation consumes a specific room, an unassigned one consumes one unit
   * of the room type's capacity.
   */
  countOverlappingByRoomType(params: {
    hotelId: string;
    checkIn: Date;
    checkOut: Date;
    excludeReservationId?: string;
    db?: DbClient;
  }): Promise<Record<string, number>> {
    const db = params.db ?? prisma;
    const reservationWhere: Prisma.ReservationWhereInput = {
      status: { in: [...ACTIVE_BOOKING_STATUSES] },
      checkIn: { lt: params.checkOut },
      checkOut: { gt: params.checkIn },
      ...(params.excludeReservationId
        ? { id: { not: params.excludeReservationId } }
        : {}),
    };

    return db.reservationRoom
      .groupBy({
        by: ["roomTypeId"],
        where: {
          roomType: { hotelId: params.hotelId },
          reservation: reservationWhere,
        },
        _count: { _all: true },
      })
      .then((rows) => {
        const counts: Record<string, number> = {};
        for (const row of rows) {
          counts[row.roomTypeId] = row._count._all;
        }
        return counts;
      });
  },

  /**
   * IDs of physical rooms occupied by overlapping active reservations for a
   * room type. Used to find which specific rooms are still free.
   */
  findOverlappingRoomIds(params: {
    roomTypeId: string;
    checkIn: Date;
    checkOut: Date;
    excludeReservationId?: string;
    db?: DbClient;
  }): Promise<string[]> {
    const db = params.db ?? prisma;
    const reservationWhere: Prisma.ReservationWhereInput = {
      status: { in: [...ACTIVE_BOOKING_STATUSES] },
      checkIn: { lt: params.checkOut },
      checkOut: { gt: params.checkIn },
      ...(params.excludeReservationId
        ? { id: { not: params.excludeReservationId } }
        : {}),
    };

    return db.reservationRoom
      .findMany({
        where: {
          roomTypeId: params.roomTypeId,
          roomId: { not: null },
          reservation: reservationWhere,
        },
        select: { roomId: true },
      })
      .then((rows) => rows.map((row) => row.roomId).filter((id): id is string => id !== null));
  },
};

const reservationDetailInclude = {
  guest: true,
  rooms: { include: { roomType: true, room: true } },
  payments: true,
  auditLogs: {
    orderBy: { createdAt: "desc" as const },
    take: 20,
    include: { user: { select: { id: true, name: true, email: true } } },
  },
} satisfies Prisma.ReservationInclude;

const reservationListInclude = {
  guest: { select: { id: true, firstName: true, lastName: true, email: true } },
  rooms: { include: { roomType: { select: { id: true, name: true } }, room: { select: { id: true, roomNumber: true } } } },
  payments: { select: { id: true, status: true, amount: true, method: true } },
} satisfies Prisma.ReservationInclude;
