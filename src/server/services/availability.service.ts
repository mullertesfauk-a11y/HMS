import "server-only";

import { RoomTypeStatus } from "@/generated/prisma/client";
import { calculateNights as nightsBetween, isValidDateRange } from "@/lib/dates";
import { calculatePricing } from "@/lib/domain/pricing";
import { NotFoundError, ReservationConflictError, ValidationError } from "@/lib/errors";
import { prisma } from "@/lib/db/prisma";
import { reservationRepository } from "@/server/repositories/reservation.repository";
import { roomRepository } from "@/server/repositories/room.repository";
import { roomTypeRepository } from "@/server/repositories/room-type.repository";
import type { DbClient } from "@/server/repositories/types";

/**
 * Availability engine.
 *
 * Model (important):
 *  - The public website books a ROOM TYPE, not a physical room. ReservationRoom
 *    rows with `roomId = null` consume one unit of the room type's capacity;
 *    rows with a `roomId` consume a specific room (and one capacity unit).
 *  - Available capacity for a type =
 *      bookable rooms of the type
 *      − overlapping ReservationRoom rows (assigned + unassigned)
 *    where "overlapping" means an ACTIVE reservation whose stay intersects the
 *    requested range: existingCheckIn < requestedCheckOut AND
 *    existingCheckOut > requestedCheckIn (a checkout day is bookable by the
 *    next guest).
 *  - Rooms in MAINTENANCE / OUT_OF_SERVICE and room types in INACTIVE are
 *    never bookable, regardless of dates.
 *
 * The database is the source of truth: `validateRoomAvailability` is re-run
 * INSIDE the reservation transaction (pass `db`) so concurrent bookings cannot
 * double-book (see reservation service, Phase 3).
 */

export interface AvailabilitySearchParams {
  hotelId: string;
  /** UTC-midnight dates (see src/lib/dates.ts). */
  checkIn: Date;
  checkOut: Date;
  adults: number;
  children: number;
  /** Tax percentage applied to the stay total (hotel setting; 0 until configured). */
  taxRate?: number;
}

export interface AvailableRoomType {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  bedType: string;
  size: string | null;
  imageUrl: string | null;
  maxAdults: number;
  maxChildren: number;
  basePrice: number;
  amenities: { id: string; name: string; icon: string | null }[];
  availableRooms: number;
  /** Server-computed pricing for the stay. */
  nights: number;
  subtotal: number;
  tax: number;
  total: number;
}

export interface RoomTypeAvailability {
  roomTypeId: string;
  /** Total bookable rooms of the type (excludes MAINTENANCE/OUT_OF_SERVICE). */
  inventory: number;
  /** Overlapping ACTIVE reservations consuming capacity of this type. */
  overlapping: number;
  availableRooms: number;
}

export class AvailabilityService {
  /** Number of nights in a stay (delegates to the timezone-safe helper). */
  calculateNights(checkIn: Date, checkOut: Date): number {
    return nightsBetween(checkIn, checkOut);
  }

  /** Server-authoritative price for a stay (delegates to the pricing module). */
  calculatePrice(input: { pricePerNight: number; numberOfNights: number; taxRate?: number }) {
    return calculatePricing(input);
  }

  /**
   * Room types bookable for the requested stay, with server-computed pricing.
   * Room types that are INACTIVE, over capacity, or fully booked are excluded.
   */
  async searchAvailability(params: AvailabilitySearchParams): Promise<AvailableRoomType[]> {
    this.assertValidSearchParams(params);
    const nights = this.calculateNights(params.checkIn, params.checkOut);
    const taxRate = params.taxRate ?? 0;

    const roomTypes = await roomTypeRepository.listActive(params.hotelId);
    const inventory = await roomRepository.countBookableByRoomType({ hotelId: params.hotelId });
    const overlapping = await reservationRepository.countOverlappingByRoomType({
      hotelId: params.hotelId,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
    });

    const results: AvailableRoomType[] = [];

    for (const roomType of roomTypes) {
      // Capacity: guests must not exceed the room type's capacity.
      if (roomType.capacity < params.adults + params.children) continue;
      if (roomType.maxAdults < params.adults) continue;
      if (roomType.maxChildren < params.children) continue;

      const availableRooms = Math.max(
        0,
        (inventory[roomType.id] ?? 0) - (overlapping[roomType.id] ?? 0),
      );
      if (availableRooms < 1) continue;

      const pricePerNight = roomType.basePrice.toNumber();
      const pricing = this.calculatePrice({ pricePerNight, numberOfNights: nights, taxRate });

      results.push({
        id: roomType.id,
        slug: roomType.slug,
        name: roomType.name,
        description: roomType.description,
        bedType: roomType.bedType,
        size: roomType.size,
        imageUrl: roomType.imageUrl,
        maxAdults: roomType.maxAdults,
        maxChildren: roomType.maxChildren,
        basePrice: pricePerNight,
        amenities: roomType.amenities.map((link) => ({
          id: link.amenity.id,
          name: link.amenity.name,
          icon: link.amenity.icon,
        })),
        availableRooms,
        nights,
        subtotal: pricing.subtotal,
        tax: pricing.tax,
        total: pricing.total,
      });
    }

    return results;
  }

  /**
   * Availability breakdown for a single room type. Used by room detail pages
   * and by `validateRoomAvailability`. Pass `db` (transaction client) to run
   * the check against in-flight transaction state.
   */
  async getRoomTypeAvailability(params: {
    hotelId: string;
    roomTypeId: string;
    checkIn: Date;
    checkOut: Date;
    excludeReservationId?: string;
    db?: DbClient;
  }): Promise<RoomTypeAvailability> {
    const roomType = await roomTypeRepository.findById(params.roomTypeId);
    if (!roomType || roomType.hotelId !== params.hotelId) {
      throw new NotFoundError("Room type not found");
    }
    if (roomType.status !== RoomTypeStatus.ACTIVE) {
      throw new ReservationConflictError("This room type is not currently bookable");
    }

    const db = params.db ?? prisma;
    const [inventory, overlapping] = await Promise.all([
      roomRepository.countBookableByRoomType({ hotelId: params.hotelId, db }),
      reservationRepository.countOverlappingByRoomType({
        hotelId: params.hotelId,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        excludeReservationId: params.excludeReservationId,
        db,
      }),
    ]);

    const inventoryCount = inventory[params.roomTypeId] ?? 0;
    const overlappingCount = overlapping[params.roomTypeId] ?? 0;

    return {
      roomTypeId: params.roomTypeId,
      inventory: inventoryCount,
      overlapping: overlappingCount,
      availableRooms: Math.max(0, inventoryCount - overlappingCount),
    };
  }

  /**
   * Physical rooms of a room type that are free for the stay. Used by hotel
   * staff to assign rooms; the public site never exposes room numbers.
   */
  async findAvailableRooms(params: {
    hotelId: string;
    roomTypeId: string;
    checkIn: Date;
    checkOut: Date;
    excludeReservationId?: string;
  }): Promise<{ id: string; roomNumber: string; floor: number | null }[]> {
    const busyRoomIds = await reservationRepository.findOverlappingRoomIds({
      roomTypeId: params.roomTypeId,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      excludeReservationId: params.excludeReservationId,
    });

    return roomRepository.findBookableByRoomType({
      roomTypeId: params.roomTypeId,
      excludeRoomIds: busyRoomIds,
    });
  }

  /**
   * Re-checks availability INSIDE the reservation transaction (source of
   * truth). Also enforces guest-count capacity. Throws ReservationConflictError
   * when the room type is no longer available, ValidationError on capacity
   * violations.
   */
  async validateRoomAvailability(params: {
    hotelId: string;
    roomTypeId: string;
    checkIn: Date;
    checkOut: Date;
    adults?: number;
    children?: number;
    roomsRequested?: number;
    excludeReservationId?: string;
    db?: DbClient;
  }): Promise<void> {
    if (!isValidDateRange(params.checkIn, params.checkOut)) {
      throw new ValidationError("checkIn must be before checkOut");
    }

    const availability = await this.getRoomTypeAvailability({
      hotelId: params.hotelId,
      roomTypeId: params.roomTypeId,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      excludeReservationId: params.excludeReservationId,
      db: params.db,
    });

    const roomsRequested = params.roomsRequested ?? 1;
    if (availability.availableRooms < roomsRequested) {
      throw new ReservationConflictError();
    }

    if (params.adults !== undefined || params.children !== undefined) {
      const roomType = await roomTypeRepository.findById(params.roomTypeId);
      if (!roomType) throw new NotFoundError("Room type not found");
      const adults = params.adults ?? 1;
      const children = params.children ?? 0;
      if (roomType.capacity < adults + children) {
        throw new ValidationError(
          `This room type holds up to ${roomType.capacity} guests (${adults + children} requested)`,
        );
      }
      if (roomType.maxAdults < adults) {
        throw new ValidationError(
          `This room type allows up to ${roomType.maxAdults} adults (${adults} requested)`,
        );
      }
      if (roomType.maxChildren < children) {
        throw new ValidationError(
          `This room type allows up to ${roomType.maxChildren} children (${children} requested)`,
        );
      }
    }
  }

  private assertValidSearchParams(params: AvailabilitySearchParams): void {
    if (Number.isNaN(params.checkIn.getTime()) || Number.isNaN(params.checkOut.getTime())) {
      throw new ValidationError("Invalid dates");
    }
    if (!isValidDateRange(params.checkIn, params.checkOut)) {
      throw new ValidationError("checkIn must be before checkOut");
    }
    if (!Number.isInteger(params.adults) || params.adults < 1 || params.adults > 20) {
      throw new ValidationError("adults must be an integer between 1 and 20");
    }
    if (!Number.isInteger(params.children) || params.children < 0 || params.children > 10) {
      throw new ValidationError("children must be an integer between 0 and 10");
    }
  }
}

export const availabilityService = new AvailabilityService();
