import "server-only";

import { Prisma, RoomStatus } from "@/generated/prisma/client";
import { ACTIVE_BOOKING_STATUSES } from "@/lib/domain/reservation-status";
import { isForeignKeyError, isUniqueConstraintError } from "@/lib/db/prisma-errors";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/db/prisma";
import { roomRepository } from "@/server/repositories/room.repository";
import type { CreateRoomInput, UpdateRoomInput } from "@/lib/validation/room";

/**
 * Room service (admin).
 *
 * - `hotelId + roomNumber` uniqueness is enforced by the DB; P2002 maps to a
 *   friendly conflict error.
 * - Deleting a room is blocked while active reservations reference it.
 */
export class RoomService {
  async create(
    input: Omit<CreateRoomInput, "status"> & { status?: RoomStatus },
    hotelId: string,
  ) {
    try {
      return await roomRepository.create({
        hotelId,
        roomTypeId: input.roomTypeId,
        roomNumber: input.roomNumber,
        floor: input.floor ?? null,
        status: input.status ?? RoomStatus.AVAILABLE,
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError(`Room number "${input.roomNumber}" already exists`);
      }
      if (isForeignKeyError(error)) {
        throw new NotFoundError("Room type not found");
      }
      throw error;
    }
  }

  async update(id: string, input: UpdateRoomInput) {
    await this.requireRoom(id);
    try {
      return await roomRepository.update(id, input);
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictError(`Room number "${input.roomNumber}" already exists`);
      }
      if (isForeignKeyError(error)) {
        throw new NotFoundError("Room type not found");
      }
      throw error;
    }
  }

  async delete(id: string) {
    await this.requireRoom(id);
    const activeLinks = await prisma.reservationRoom.count({
      where: {
        roomId: id,
        reservation: { status: { in: [...ACTIVE_BOOKING_STATUSES] } },
      },
    });
    if (activeLinks > 0) {
      throw new ConflictError("This room has active reservations and cannot be deleted");
    }
    return roomRepository.delete(id);
  }

  async list(params: {
    hotelId: string;
    search?: string;
    roomTypeId?: string;
    floor?: number;
    status?: RoomStatus;
    page: number;
    pageSize: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) {
    const orderBy: Prisma.RoomOrderByWithRelationInput =
      params.sortBy === "floor"
        ? { floor: params.sortOrder }
        : params.sortBy === "updatedAt"
          ? { updatedAt: params.sortOrder }
          : { roomNumber: "asc" };

    const { items, total } = await roomRepository.list({
      hotelId: params.hotelId,
      search: params.search,
      roomTypeId: params.roomTypeId,
      floor: params.floor,
      status: params.status,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
      orderBy,
    });

    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  private async requireRoom(id: string) {
    const room = await roomRepository.findById(id);
    if (!room) throw new NotFoundError("Room not found");
    return room;
  }
}

export const roomService = new RoomService();
