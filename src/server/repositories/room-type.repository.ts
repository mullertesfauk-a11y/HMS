import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

/**
 * Room type persistence layer. Thin — availability/pricing logic lives in
 * services.
 */
export const roomTypeRepository = {
  findById(id: string) {
    return prisma.roomType.findUnique({
      where: { id },
      include: {
        amenities: { include: { amenity: true } },
        _count: { select: { rooms: true } },
      },
    });
  },

  findBySlug(hotelId: string, slug: string) {
    return prisma.roomType.findFirst({
      where: { hotelId, slug },
      include: {
        amenities: { include: { amenity: true } },
        _count: { select: { rooms: true } },
      },
    });
  },

  listActive(hotelId: string) {
    return prisma.roomType.findMany({
      where: { hotelId, status: "ACTIVE" },
      orderBy: { basePrice: "asc" },
      include: {
        amenities: { include: { amenity: true } },
        _count: { select: { rooms: true } },
      },
    });
  },

  async list(params: {
    hotelId: string;
    search?: string;
    status?: string;
    skip: number;
    take: number;
    orderBy?: Prisma.RoomTypeOrderByWithRelationInput;
  }) {
    const where: Prisma.RoomTypeWhereInput = { hotelId: params.hotelId };
    if (params.search) {
      where.OR = [
        { name: { contains: params.search.trim(), mode: "insensitive" } },
        { bedType: { contains: params.search.trim(), mode: "insensitive" } },
      ];
    }
    if (params.status) where.status = params.status as Prisma.EnumRoomTypeStatusFilter["equals"];

    const [items, total] = await prisma.$transaction([
      prisma.roomType.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy ?? { basePrice: "asc" },
        include: { _count: { select: { rooms: true } } },
      }),
      prisma.roomType.count({ where }),
    ]);

    return { items, total };
  },

  create(data: Prisma.RoomTypeUncheckedCreateInput) {
    return prisma.roomType.create({ data });
  },

  update(id: string, data: Prisma.RoomTypeUncheckedUpdateInput) {
    return prisma.roomType.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.roomType.delete({ where: { id } });
  },
};
