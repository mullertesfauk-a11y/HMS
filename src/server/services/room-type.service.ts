import "server-only";

import { Prisma, RoomTypeStatus } from "@/generated/prisma/client";
import { isForeignKeyError } from "@/lib/db/prisma-errors";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/db/prisma";
import { slugify } from "@/lib/utils/slugify";
import { roomTypeRepository } from "@/server/repositories/room-type.repository";
import type { CreateRoomTypeInput, UpdateRoomTypeInput } from "@/lib/validation/room-type";

/**
 * Room type service (admin).
 *
 * - Slug is derived from the name; collisions get a numeric suffix.
 * - Amenity links are replaced atomically on create/update.
 * - Deleting a room type is blocked while reservations reference it.
 */
export class RoomTypeService {
  async create(
    input: Omit<CreateRoomTypeInput, "status"> & { status?: RoomTypeStatus },
    hotelId: string,
  ) {
    const slug = await this.uniqueSlug(hotelId, input.name);

    return prisma.$transaction(async (tx) => {
      const roomType = await tx.roomType.create({
        data: {
          hotelId,
          name: input.name,
          slug,
          description: input.description,
          capacity: input.capacity,
          maxAdults: input.maxAdults,
          maxChildren: input.maxChildren,
          bedType: input.bedType,
          size: input.size,
          basePrice: input.basePrice,
          status: input.status ?? RoomTypeStatus.ACTIVE,
        },
      });

      if (input.amenityIds && input.amenityIds.length > 0) {
        await tx.roomTypeAmenity.createMany({
          data: input.amenityIds.map((amenityId) => ({ roomTypeId: roomType.id, amenityId })),
          skipDuplicates: true,
        });
      }

      return roomType;
    });
  }

  async update(id: string, input: UpdateRoomTypeInput) {
    await this.requireRoomType(id);

    return prisma.$transaction(async (tx) => {
      const roomType = await tx.roomType.update({
        where: { id },
        data: {
          name: input.name,
          description: input.description,
          capacity: input.capacity,
          maxAdults: input.maxAdults,
          maxChildren: input.maxChildren,
          bedType: input.bedType,
          size: input.size,
          basePrice: input.basePrice,
          status: input.status,
        },
      });

      if (input.amenityIds) {
        await tx.roomTypeAmenity.deleteMany({ where: { roomTypeId: id } });
        if (input.amenityIds.length > 0) {
          await tx.roomTypeAmenity.createMany({
            data: input.amenityIds.map((amenityId) => ({ roomTypeId: id, amenityId })),
            skipDuplicates: true,
          });
        }
      }

      return roomType;
    });
  }

  async delete(id: string) {
    await this.requireRoomType(id);
    try {
      return await roomTypeRepository.delete(id);
    } catch (error) {
      if (isForeignKeyError(error)) {
        throw new ConflictError(
          "This room type is referenced by rooms or reservations and cannot be deleted",
        );
      }
      throw error;
    }
  }

  async list(params: {
    hotelId: string;
    search?: string;
    status?: string;
    page: number;
    pageSize: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const orderBy: Prisma.RoomTypeOrderByWithRelationInput =
      params.sortBy === "basePrice"
        ? { basePrice: params.sortOrder }
        : params.sortBy === "updatedAt"
          ? { updatedAt: params.sortOrder }
          : params.sortBy === "status"
            ? { status: params.sortOrder }
            : { basePrice: "asc" };

    const { items, total } = await roomTypeRepository.list({
      hotelId: params.hotelId,
      search: params.search,
      status: params.status,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      orderBy,
    });

    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  private async requireRoomType(id: string) {
    const roomType = await roomTypeRepository.findById(id);
    if (!roomType) throw new NotFoundError("Room type not found");
    return roomType;
  }

  private async uniqueSlug(hotelId: string, name: string): Promise<string> {
    const base = slugify(name) || "room-type";
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
      const existing = await prisma.roomType.findFirst({
        where: { hotelId, slug: candidate },
        select: { id: true },
      });
      if (!existing) return candidate;
    }
    throw new ConflictError("Could not generate a unique slug");
  }
}

export const roomTypeService = new RoomTypeService();
