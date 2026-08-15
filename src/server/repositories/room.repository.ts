import "server-only";

import { Prisma, RoomStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { DbClient } from "@/server/repositories/types";

/**
 * Room persistence layer. Thin — business rules (e.g. rooms of a given room
 * type that are bookable for a date range) live in the availability service.
 */
export const roomRepository = {
  findById(id: string) {
    return prisma.room.findUnique({
      where: { id },
      include: { roomType: true },
    });
  },

  findByNumber(hotelId: string, roomNumber: string) {
    return prisma.room.findUnique({
      where: { hotelId_roomNumber: { hotelId, roomNumber } },
      include: { roomType: true },
    });
  },

  listByRoomType(roomTypeId: string) {
    return prisma.room.findMany({ where: { roomTypeId } });
  },

  /**
   * Bookable room inventory per room type (rooms NOT in MAINTENANCE /
   * OUT_OF_SERVICE). Keyed by roomTypeId. Housekeeping status (AVAILABLE /
   * OCCUPIED) is NOT used here — future-date availability is driven by
   * reservations, not the current housekeeping snapshot.
   */
  async countBookableByRoomType(params: {
    hotelId: string;
    db?: DbClient;
  }): Promise<Record<string, number>> {
    const db = params.db ?? prisma;
    const rows = await db.room.groupBy({
      by: ["roomTypeId"],
      where: {
        hotelId: params.hotelId,
        status: { notIn: [RoomStatus.MAINTENANCE, RoomStatus.OUT_OF_SERVICE] },
      },
      _count: { _all: true },
    });
    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.roomTypeId] = row._count._all;
    }
    return counts;
  },

  /** Bookable physical rooms of a room type, optionally excluding busy rooms. */
  findBookableByRoomType(params: {
    roomTypeId: string;
    excludeRoomIds?: string[];
    db?: DbClient;
  }) {
    const db = params.db ?? prisma;
    return db.room.findMany({
      where: {
        roomTypeId: params.roomTypeId,
        status: { notIn: [RoomStatus.MAINTENANCE, RoomStatus.OUT_OF_SERVICE] },
        ...(params.excludeRoomIds && params.excludeRoomIds.length > 0
          ? { NOT: { id: { in: params.excludeRoomIds } } }
          : {}),
      },
      orderBy: { roomNumber: "asc" },
      select: { id: true, roomNumber: true, floor: true },
    });
  },

  async list(params: {
    hotelId: string;
    search?: string;
    roomTypeId?: string;
    floor?: number;
    status?: RoomStatus;
    skip: number;
    take: number;
    orderBy?: Prisma.RoomOrderByWithRelationInput;
  }) {
    const where: Prisma.RoomWhereInput = { hotelId: params.hotelId };
    if (params.search) {
      where.roomNumber = { contains: params.search.trim(), mode: "insensitive" };
    }
    if (params.roomTypeId) where.roomTypeId = params.roomTypeId;
    if (params.floor !== undefined) where.floor = params.floor;
    if (params.status) where.status = params.status;

    const [items, total] = await prisma.$transaction([
      prisma.room.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy ?? { roomNumber: "asc" },
        include: {
          roomType: { select: { id: true, name: true, basePrice: true } },
          reservationRooms: {
            where: { reservation: { status: { in: ["CONFIRMED", "CHECKED_IN"] } } },
            select: {
              reservation: {
                select: {
                  id: true,
                  reservationNumber: true,
                  checkIn: true,
                  checkOut: true,
                  guest: { select: { id: true, firstName: true, lastName: true } },
                },
              },
            },
            orderBy: { reservation: { checkIn: "asc" } },
            take: 1,
          },
        },
      }),
      prisma.room.count({ where }),
    ]);

    return { items, total };
  },

  create(data: Prisma.RoomUncheckedCreateInput) {
    return prisma.room.create({ data });
  },

  update(id: string, data: Prisma.RoomUncheckedUpdateInput) {
    return prisma.room.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.room.delete({ where: { id } });
  },
};
