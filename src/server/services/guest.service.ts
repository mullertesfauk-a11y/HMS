import "server-only";

import { prisma } from "@/lib/db/prisma";
import { guestRepository } from "@/server/repositories/guest.repository";
import type { CreateGuestInput, UpdateGuestInput } from "@/lib/validation/guest";
import { NotFoundError } from "@/lib/errors";

/**
 * Guest service.
 *
 * Guests do not have accounts in the MVP — they are identified by email and
 * created/updated as part of reservation flows.
 */
export class GuestService {
  /** Find a guest by email or create one from reservation details. */
  async findOrCreate(input: CreateGuestInput) {
    return guestRepository.findOrCreate(input);
  }

  async findById(id: string) {
    const guest = await guestRepository.findById(id);
    if (!guest) throw new NotFoundError("Guest not found");
    return guest;
  }

  async list(params: { search?: string; page: number; pageSize: number }) {
    return guestRepository.list({
      search: params.search,
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    });
  }

  /** Guest detail with reservation history (admin view). */
  async getWithHistory(id: string) {
    const guest = await this.findById(id);
    const now = new Date();
    const reservations = await prisma.reservation.findMany({
      where: { guestId: id },
      orderBy: { checkIn: "desc" },
      include: {
        rooms: {
          include: {
            roomType: { select: { id: true, name: true, slug: true } },
            room: { select: { id: true, roomNumber: true } },
          },
        },
      },
    });

    const activeStatuses = ["PENDING", "CONFIRMED", "CHECKED_IN"];
    return {
      ...guest,
      totalStays: reservations.filter((r) =>
        ["CHECKED_IN", "CHECKED_OUT"].includes(r.status),
      ).length,
      upcoming: reservations.filter(
        (r) => r.checkIn.getTime() >= now.getTime() && activeStatuses.includes(r.status),
      ),
      previous: reservations.filter(
        (r) =>
          r.checkIn.getTime() < now.getTime() ||
          ["CHECKED_OUT", "CANCELLED", "NO_SHOW"].includes(r.status),
      ),
    };
  }

  async update(id: string, input: UpdateGuestInput) {
    await this.findById(id);
    return guestRepository.update(id, input);
  }
}

export const guestService = new GuestService();
