import "server-only";

import {
  PaymentMethod,
  PaymentStatus,
  Prisma,
  ReservationStatus,
  RoomStatus,
  RoomTypeStatus,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { calculateNights, hotelDateToUtc } from "@/lib/dates";
import { generateReservationNumber } from "@/lib/domain/reservation-number";
import { calculatePricing } from "@/lib/domain/pricing";
import { isCancellable, transitionReservationStatus } from "@/lib/domain/reservation-status";
import {
  ConflictError,
  InvalidReservationStateError,
  NotFoundError,
  ReservationConflictError,
  ValidationError,
} from "@/lib/errors";
import { logger } from "@/lib/logger";
import { auditRepository } from "@/server/repositories/audit.repository";
import { guestRepository } from "@/server/repositories/guest.repository";
import { reservationRepository } from "@/server/repositories/reservation.repository";
import { roomRepository } from "@/server/repositories/room.repository";
import { roomTypeRepository } from "@/server/repositories/room-type.repository";
import { availabilityService } from "@/server/services/availability.service";
import type { DbClient } from "@/server/repositories/types";
import type {
  CreateReservationInput,
  UpdateReservationInput,
} from "@/lib/validation/reservation";

/**
 * Reservation domain service — the CENTRAL entry point for every reservation
 * operation from any client (public website, admin portal, future mobile app /
 * integrations).
 *
 * `createReservation` is a single DB transaction (spec §20, §61):
 *   1. defensive input + date validation
 *   2. room type lookup (by slug, must be ACTIVE)
 *   3. server-side pricing (never trust client totals)
 *   4. INSIDE the transaction: availability re-check (source of truth),
 *      guest find-or-create, unique reservation number, reservation +
 *      ReservationRoom + PENDING payment creation, audit entry
 *   5. structured log event
 *
 * Status changes go through the state machine in
 * src/lib/domain/reservation-status.ts. Public bookings reserve a room TYPE,
 * not a room number; admin walk-in bookings can pass `roomId` to pre-assign a
 * specific physical room inside the same transaction (otherwise rooms are
 * assigned later via `assignRoom`).
 */

const DETAIL_INCLUDE = {
  guest: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
  },
  rooms: {
    include: {
      roomType: {
        select: { id: true, name: true, slug: true, basePrice: true },
      },
      room: { select: { id: true, roomNumber: true, floor: true } },
    },
  },
  payments: {
    select: {
      id: true,
      amount: true,
      currency: true,
      method: true,
      status: true,
      transactionReference: true,
      paidAt: true,
    },
  },
} satisfies Prisma.ReservationInclude;

export type ReservationWithDetails = Prisma.ReservationGetPayload<{
  include: typeof DETAIL_INCLUDE;
}>;

export interface ReservationServiceContext {
  hotelId: string;
  currency: string;
  taxRate: number;
  /** When created by a staff member from the admin portal. */
  createdById?: string;
  /**
   * Create the reservation already CHECKED_IN (walk-in bookings). The guest
   * is physically present, so the PENDING → CONFIRMED pre-arrival flow is
   * skipped entirely; the stay still occupies inventory like any other
   * active booking.
   */
  checkInNow?: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface RequestMeta {
  ipAddress?: string;
  userAgent?: string;
  reason?: string;
}

export class ReservationService {
  /**
   * Create a reservation from any client. Returns the created reservation
   * (with guest/rooms/payments). Throws ReservationConflictError when the
   * room type is no longer available; ValidationError on bad input.
   */
  async createReservation(
    input: CreateReservationInput,
    context: ReservationServiceContext,
  ): Promise<ReservationWithDetails> {
    const checkIn = hotelDateToUtc(input.checkIn);
    const checkOut = hotelDateToUtc(input.checkOut);
    if (!checkIn || !checkOut) {
      throw new ValidationError("Invalid check-in/check-out dates");
    }

    const roomType = await roomTypeRepository.findBySlug(context.hotelId, input.roomTypeSlug);
    if (!roomType || roomType.status !== RoomTypeStatus.ACTIVE) {
      throw new NotFoundError("Room type not found");
    }

    const nights = calculateNights(checkIn, checkOut);
    const pricePerNight = roomType.basePrice.toNumber();
    const pricing = calculatePricing({
      pricePerNight,
      numberOfNights: nights,
      taxRate: context.taxRate,
    });
    // Walk-in bookings (guest physically present) start CHECKED_IN; all other
    // reservations start PENDING and flow through the state machine.
    const initialStatus = context.checkInNow
      ? ReservationStatus.CHECKED_IN
      : ReservationStatus.PENDING;

    const reservation = await prisma.$transaction(async (tx) => {
      // 1. Re-check availability inside the transaction (source of truth).
      await availabilityService.validateRoomAvailability({
        hotelId: context.hotelId,
        roomTypeId: roomType.id,
        checkIn,
        checkOut,
        adults: input.adults,
        children: input.children,
        db: tx,
      });

      // 1b. Admin walk-in bookings can pre-assign a specific physical room.
      //     Same rules as `assignRoom` (matches the room type, bookable,
      //     free for the stay), enforced atomically at creation.
      let assignedRoom: { id: string; roomNumber: string } | null = null;
      if (input.roomId) {
        const room = await tx.room.findUnique({
          where: { id: input.roomId },
          select: {
            id: true,
            roomNumber: true,
            status: true,
            roomTypeId: true,
            hotelId: true,
          },
        });
        if (!room || room.hotelId !== context.hotelId) {
          throw new NotFoundError("Room not found");
        }
        if (room.status === RoomStatus.MAINTENANCE || room.status === RoomStatus.OUT_OF_SERVICE) {
          throw new ReservationConflictError("This room is not bookable");
        }
        if (room.roomTypeId !== roomType.id) {
          throw new ConflictError("Room does not match the reserved room type");
        }
        const busyRoomIds = await reservationRepository.findOverlappingRoomIds({
          roomTypeId: roomType.id,
          checkIn,
          checkOut,
          db: tx,
        });
        if (busyRoomIds.includes(room.id)) {
          throw new ReservationConflictError("This room is already booked for the stay dates");
        }
        assignedRoom = { id: room.id, roomNumber: room.roomNumber };
      }

      // 2. Guest find-or-create (dedupe by email).
      const guest = await guestRepository.findOrCreate(
        {
          firstName: input.guest.firstName,
          lastName: input.guest.lastName,
          email: input.guest.email ?? null,
          phone: input.guest.phone ?? null,
          country: input.guest.country ?? null,
          specialNotes: input.guest.specialNotes ?? null,
        },
        tx,
      );

      // 3. Human-friendly unique reservation number.
      const reservationNumber = await this.generateUniqueReservationNumber(tx);

      // 4. Reservation + room line (room type, unassigned) + PENDING payment.
      const created = await tx.reservation.create({
        data: {
          reservationNumber,
          hotelId: context.hotelId,
          guestId: guest.id,
          checkIn,
          checkOut,
          adults: input.adults,
          children: input.children,
          status: initialStatus,
          subtotal: pricing.subtotal,
          tax: pricing.tax,
          discount: pricing.discount,
          total: pricing.total,
          currency: context.currency,
          specialRequests: input.specialRequests,
          createdById: context.createdById,
          rooms: {
            create: {
              roomTypeId: roomType.id,
              ...(assignedRoom ? { roomId: assignedRoom.id } : {}),
              pricePerNight,
              numberOfNights: nights,
              subtotal: pricing.subtotal,
            },
          },
          payments: {
            create: {
              amount: pricing.total,
              currency: context.currency,
              method: PaymentMethod.ONLINE,
              status: PaymentStatus.PENDING,
            },
          },
        },
        include: DETAIL_INCLUDE,
      });

      // 5. Audit inside the same transaction.
      await auditRepository.log({
        action: "reservation.created",
        entity: "reservation",
        entityId: created.id,
        reservationId: created.id,
        userId: context.createdById,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        newData: {
          reservationNumber,
          status: created.status,
          roomTypeSlug: roomType.slug,
          ...(assignedRoom ? { roomNumber: assignedRoom.roomNumber } : {}),
          checkIn: input.checkIn,
          checkOut: input.checkOut,
          nights,
          total: pricing.total,
          currency: context.currency,
        },
        db: tx,
      });

        return created;
      },
      { maxWait: 10_000, timeout: 20_000 },
    );

    logger.info("reservation.created", {
      reservationNumber: reservation.reservationNumber,
      hotelId: context.hotelId,
      roomTypeSlug: roomType.slug,
      nights,
      total: pricing.total,
    });

    return reservation;
  }

  /**
   * Public lookup: reservation number + guest last name (privacy gate).
   * Returns the internal entity — callers map it with the public view.
   */
  async lookup(input: {
    reservationNumber: string;
    lastName: string;
  }): Promise<ReservationWithDetails> {
    const reservation = await reservationRepository.findByNumber(
      input.reservationNumber.trim(),
      DETAIL_INCLUDE,
    );
    if (
      !reservation ||
      reservation.guest.lastName.toLowerCase() !== input.lastName.trim().toLowerCase()
    ) {
      // Do not reveal whether the reservation exists.
      throw new NotFoundError("Reservation not found");
    }
    return reservation;
  }

  /** Public cancellation: number + last name (privacy gate). */
  async cancelPublic(
    input: { reservationNumber: string; lastName: string },
    meta?: RequestMeta,
  ): Promise<ReservationWithDetails> {
    const reservation = await this.lookup(input);
    return this.cancelById(reservation.id, undefined, meta, true);
  }

  /** Admin/staff cancellation by internal id. */
  async cancelById(
    reservationId: string,
    actorId?: string,
    meta?: RequestMeta,
    isPublic = false,
  ): Promise<ReservationWithDetails> {
    return this.transition(
      reservationId,
      ReservationStatus.CANCELLED,
      actorId,
      meta,
      isPublic,
      { cancelledAt: new Date() },
    );
  }

  async confirm(
    reservationId: string,
    actorId?: string,
    meta?: RequestMeta,
  ): Promise<ReservationWithDetails> {
    return this.transition(reservationId, ReservationStatus.CONFIRMED, actorId, meta);
  }

  async checkIn(
    reservationId: string,
    actorId?: string,
    meta?: RequestMeta,
  ): Promise<ReservationWithDetails> {
    return this.transition(reservationId, ReservationStatus.CHECKED_IN, actorId, meta);
  }

  async checkOut(
    reservationId: string,
    actorId?: string,
    meta?: RequestMeta,
  ): Promise<ReservationWithDetails> {
    return this.transition(reservationId, ReservationStatus.CHECKED_OUT, actorId, meta);
  }

  async markNoShow(
    reservationId: string,
    actorId?: string,
    meta?: RequestMeta,
  ): Promise<ReservationWithDetails> {
    return this.transition(reservationId, ReservationStatus.NO_SHOW, actorId, meta);
  }

  /**
   * Admin reservation edit (PATCH).
   *
   * - Date changes re-check availability for the new range EXCLUDING this
   *   reservation, then reprice server-side (nights × pricePerNight + tax).
   * - The pending payment amount is kept in sync.
   * - Guests count / special requests update directly.
   */
  async updateReservation(
    reservationId: string,
    input: UpdateReservationInput,
    context: Pick<ReservationServiceContext, "taxRate"> & { actorId?: string },
  ): Promise<ReservationWithDetails> {
    const reservation = await reservationRepository.findById(reservationId, DETAIL_INCLUDE);
    if (!reservation) throw new NotFoundError("Reservation not found");
    if (reservation.status === ReservationStatus.CANCELLED || reservation.status === ReservationStatus.CHECKED_OUT) {
      throw new InvalidReservationStateError(
        `Reservations in state ${reservation.status} cannot be edited`,
      );
    }

    const checkIn = input.checkIn ? hotelDateToUtc(input.checkIn) : reservation.checkIn;
    const checkOut = input.checkOut ? hotelDateToUtc(input.checkOut) : reservation.checkOut;
    if (!checkIn || !checkOut) throw new ValidationError("Invalid dates");

    const datesChanged =
      checkIn.getTime() !== reservation.checkIn.getTime() ||
      checkOut.getTime() !== reservation.checkOut.getTime();
    const roomLine = reservation.rooms[0];
    if (!roomLine) throw new ConflictError("Reservation has no room line to reprice");

    const nights = calculateNights(checkIn, checkOut);
    const pricing = calculatePricing({
      pricePerNight: roomLine.pricePerNight.toNumber(),
      numberOfNights: nights,
      taxRate: context.taxRate,
    });

    const updated = await prisma.$transaction(async (tx) => {
      if (datesChanged) {
        await availabilityService.validateRoomAvailability({
          hotelId: reservation.hotelId,
          roomTypeId: roomLine.roomTypeId,
          checkIn,
          checkOut,
          adults: input.adults ?? reservation.adults,
          children: input.children ?? reservation.children,
          excludeReservationId: reservation.id,
          db: tx,
        });
      }

      const result = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          checkIn,
          checkOut,
          adults: input.adults ?? reservation.adults,
          children: input.children ?? reservation.children,
          specialRequests: input.specialRequests ?? reservation.specialRequests,
          subtotal: pricing.subtotal,
          tax: pricing.tax,
          discount: pricing.discount,
          total: pricing.total,
        },
        include: DETAIL_INCLUDE,
      });

      await tx.reservationRoom.update({
        where: { id: roomLine.id },
        data: { numberOfNights: nights, subtotal: pricing.subtotal },
      });

      // Keep the PENDING payment aligned with the new total.
      const pendingPayment = result.payments.find((payment) => payment.status === PaymentStatus.PENDING);
      if (pendingPayment) {
        await tx.payment.update({
          where: { id: pendingPayment.id },
          data: { amount: pricing.total },
        });
      }

      await auditRepository.log({
        action: "reservation.updated",
        entity: "reservation",
        entityId: reservationId,
        reservationId,
        userId: context.actorId,
        oldData: {
          checkIn: reservation.checkIn,
          checkOut: reservation.checkOut,
          adults: reservation.adults,
          children: reservation.children,
          total: reservation.total,
        },
        newData: {
          checkIn,
          checkOut,
          adults: input.adults ?? reservation.adults,
          children: input.children ?? reservation.children,
          total: pricing.total,
        },
        db: tx,
      });

      return result;
    }, { maxWait: 10_000, timeout: 20_000 });

    logger.info("reservation.updated", {
      reservationId,
      reservationNumber: reservation.reservationNumber,
      datesChanged,
      total: pricing.total,
    });

    return updated;
  }

  /**
   * Assign a physical room to a reservation (hotel staff). The room must
   * belong to the reserved room type, be bookable, and be free for the stay.
   */
  async assignRoom(
    reservationId: string,
    roomId: string,
    actorId?: string,
    meta?: RequestMeta,
  ): Promise<ReservationWithDetails> {
    const reservation = await reservationRepository.findById(reservationId, DETAIL_INCLUDE);
    if (!reservation) throw new NotFoundError("Reservation not found");
    if (
      reservation.status !== ReservationStatus.PENDING &&
      reservation.status !== ReservationStatus.CONFIRMED
    ) {
      throw new InvalidReservationStateError(
        "A room can only be assigned to a pending or confirmed reservation",
      );
    }

    const reservationRoom = reservation.rooms[0];
    if (!reservationRoom) {
      throw new ConflictError("Reservation has no room line to assign");
    }

    const room = await roomRepository.findById(roomId);
    if (!room || room.hotelId !== reservation.hotelId) {
      throw new NotFoundError("Room not found");
    }
    if (room.status === RoomStatus.MAINTENANCE || room.status === RoomStatus.OUT_OF_SERVICE) {
      throw new ReservationConflictError("This room is not bookable");
    }
    if (room.roomTypeId !== reservationRoom.roomTypeId) {
      throw new ConflictError("Room does not match the reserved room type");
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Re-check the specific room is free for the stay (excluding this reservation).
      const busyRoomIds = await reservationRepository.findOverlappingRoomIds({
        roomTypeId: room.roomTypeId,
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
        excludeReservationId: reservation.id,
        db: tx,
      });
      if (busyRoomIds.includes(room.id)) {
        throw new ReservationConflictError("This room is already booked for the stay dates");
      }

      await tx.reservationRoom.update({
        where: { id: reservationRoom.id },
        data: { roomId: room.id },
      });

      const result = await tx.reservation.findUniqueOrThrow({
        where: { id: reservationId },
        include: DETAIL_INCLUDE,
      });

      await auditRepository.log({
        action: "reservation.room_assigned",
        entity: "reservation",
        entityId: reservationId,
        reservationId,
        userId: actorId,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        oldData: { roomId: reservationRoom.roomId ?? null },
        newData: { roomId: room.id, roomNumber: room.roomNumber },
        db: tx,
      });

        return result;
      },
      { maxWait: 10_000, timeout: 20_000 },
    );

    logger.info("reservation.room_assigned", {
      reservationId,
      reservationNumber: reservation.reservationNumber,
      roomNumber: room.roomNumber,
    });

    return updated;
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private async generateUniqueReservationNumber(db: DbClient): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = generateReservationNumber();
      const existing = await db.reservation.findUnique({
        where: { reservationNumber: candidate },
        select: { id: true },
      });
      if (!existing) return candidate;
    }
    throw new ConflictError("Could not generate a unique reservation number");
  }

  /** State-machine-guarded transition with audit + log, in one transaction. */
  private async transition(
    reservationId: string,
    to: ReservationStatus,
    actorId?: string,
    meta?: RequestMeta,
    isPublic = false,
    extra?: { cancelledAt?: Date },
  ): Promise<ReservationWithDetails> {
    const reservation = await reservationRepository.findById(reservationId, DETAIL_INCLUDE);
    if (!reservation) throw new NotFoundError("Reservation not found");

    if (to === ReservationStatus.CANCELLED && !isCancellable(reservation.status)) {
      throw new InvalidReservationStateError(
        `Reservations in state ${reservation.status} cannot be cancelled`,
      );
    }
    // Validates the transition and throws InvalidReservationStateError.
    transitionReservationStatus(reservation.status, to);

    const action = `reservation.${to.toLowerCase()}`;

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.reservation.update({
        where: { id: reservationId },
        data: {
          status: to,
          ...(extra?.cancelledAt ? { cancelledAt: extra.cancelledAt } : {}),
        },
        include: DETAIL_INCLUDE,
      });

      await auditRepository.log({
        action,
        entity: "reservation",
        entityId: reservationId,
        reservationId,
        userId: isPublic ? undefined : actorId,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        oldData: { status: reservation.status },
        newData: { status: to, ...(extra?.cancelledAt ? { cancelledAt: extra.cancelledAt } : {}) },
        db: tx,
      });

        return result;
      },
      { maxWait: 10_000, timeout: 20_000 },
    );

    logger.info(action, {
      reservationId,
      reservationNumber: reservation.reservationNumber,
      from: reservation.status,
      to,
    });

    return updated;
  }
}

export const reservationService = new ReservationService();
