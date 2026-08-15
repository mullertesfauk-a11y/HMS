import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Prisma, ReservationStatus, RoomStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { hotelDateToUtc } from "@/lib/dates";
import { ReservationConflictError, ValidationError } from "@/lib/errors";
import {
  availabilityService,
  type AvailableRoomType,
} from "@/server/services/availability.service";

/**
 * Availability engine integration tests — require a live, seeded database
 * (Neon). Skipped automatically when DATABASE_URL is not configured.
 *
 * Assertions use deltas against the current database state so the suite is
 * robust to extra data. All created rows are cleaned up afterwards.
 */

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

describeDb("availability service (DB)", () => {
  let hotelId: string;
  let standardId: string;
  let deluxeId: string;
  let suiteId: string;
  let standardRoom: { id: string; roomNumber: string };
  let guestId: string;
  const createdReservationIds: string[] = [];
  const restoredRooms: { id: string; status: RoomStatus }[] = [];

  const checkIn = hotelDateToUtc("2026-10-05")!;
  const checkOut = hotelDateToUtc("2026-10-08")!;
  const nights = 3;

  async function search(): Promise<Awaited<ReturnType<typeof availabilityService.searchAvailability>>>;
  async function search(roomTypeId: string): Promise<AvailableRoomType | undefined>;
  async function search(roomTypeId?: string, adults = 2, children = 0) {
    const results = await availabilityService.searchAvailability({
      hotelId,
      checkIn,
      checkOut,
      adults,
      children,
    });
    return roomTypeId ? results.find((r) => r.id === roomTypeId) : results;
  }

  async function createReservation(params: {
    roomTypeId: string;
    roomId?: string;
    status?: ReservationStatus;
    resCheckIn?: Date;
    resCheckOut?: Date;
  }): Promise<string> {
    const resCheckIn = params.resCheckIn ?? checkIn;
    const resCheckOut = params.resCheckOut ?? checkOut;
    const status = params.status ?? ReservationStatus.CONFIRMED;

    const reservation = await prisma.reservation.create({
      data: {
        reservationNumber: `SMK-${randomUUID().slice(0, 8).toUpperCase()}`,
        hotelId,
        guestId,
        checkIn: resCheckIn,
        checkOut: resCheckOut,
        adults: 2,
        children: 0,
        status,
        subtotal: 300,
        tax: 0,
        discount: 0,
        total: 300,
        currency: "ETB",
        rooms: {
          create: {
            roomTypeId: params.roomTypeId,
            roomId: params.roomId,
            pricePerNight: 100,
            numberOfNights: nights,
            subtotal: 300,
          },
        },
      },
    });
    createdReservationIds.push(reservation.id);
    return reservation.id;
  }

  beforeAll(async () => {
    const hotel = await prisma.hotel.findFirst({ where: { slug: "grand-meridian" } });
    if (!hotel) throw new Error("Seed data missing — run `npx prisma db seed` first");
    hotelId = hotel.id;

    const [standard, deluxe, suite] = await Promise.all([
      prisma.roomType.findFirst({ where: { hotelId, slug: "standard-room" } }),
      prisma.roomType.findFirst({ where: { hotelId, slug: "deluxe-room" } }),
      prisma.roomType.findFirst({ where: { hotelId, slug: "suite" } }),
    ]);
    if (!standard || !deluxe || !suite) {
      throw new Error("Seed room types missing — run `npx prisma db seed` first");
    }
    standardId = standard.id;
    deluxeId = deluxe.id;
    suiteId = suite.id;

    standardRoom = (await prisma.room.findFirstOrThrow({
      where: { hotelId, roomTypeId: standardId },
      orderBy: { roomNumber: "asc" },
      select: { id: true, roomNumber: true },
    }));

    const guest = await prisma.guest.create({
      data: {
        firstName: "Avail",
        lastName: "Smoke",
        email: `avail-smoke-${randomUUID().slice(0, 8)}@example.com`,
      },
    });
    guestId = guest.id;
  });

  afterAll(async () => {
    await prisma.reservationRoom.deleteMany({
      where: { reservationId: { in: createdReservationIds } },
    });
    await prisma.reservation.deleteMany({
      where: { id: { in: createdReservationIds } },
    });
    if (guestId) {
      await prisma.guest.delete({ where: { id: guestId } }).catch(() => undefined);
    }
    for (const room of restoredRooms) {
      await prisma.room
        .update({ where: { id: room.id }, data: { status: room.status } })
        .catch(() => undefined);
    }
  });

  it("returns all seeded room types with server-computed pricing", async () => {
    const results = await search();
    expect(results.map((r) => r.slug).sort()).toEqual([
      "deluxe-room",
      "standard-room",
      "suite",
    ]);
    for (const result of results) {
      expect(result.availableRooms).toBeGreaterThan(0);
      expect(result.nights).toBe(nights);
      expect(result.subtotal).toBe(result.basePrice * nights);
      expect(result.total).toBe(result.subtotal);
      expect(result.amenities.length).toBeGreaterThan(0);
    }
  });

  it("an unassigned overlapping reservation consumes one capacity unit", async () => {
    const before = (await search(standardId))!.availableRooms;
    await createReservation({ roomTypeId: standardId }); // unassigned, CONFIRMED, overlapping
    const after = (await search(standardId))!.availableRooms;
    expect(after).toBe(before - 1);
  });

  it("an assigned reservation blocks that specific room", async () => {
    const deluxeRoom = await prisma.room.findFirstOrThrow({
      where: { hotelId, roomTypeId: deluxeId },
      orderBy: { roomNumber: "asc" },
    });
    const before = (await search(deluxeId))!.availableRooms;
    await createReservation({ roomTypeId: deluxeId, roomId: deluxeRoom.id });

    const after = (await search(deluxeId))!.availableRooms;
    expect(after).toBe(before - 1);

    const freeRooms = await availabilityService.findAvailableRooms({
      hotelId,
      roomTypeId: deluxeId,
      checkIn,
      checkOut,
    });
    expect(freeRooms.map((r) => r.id)).not.toContain(deluxeRoom.id);
  });

  it("exact checkout/check-in boundary does NOT block (next guest allowed)", async () => {
    const before = (await search(suiteId))!.availableRooms;
    const suiteRoom = await prisma.room.findFirstOrThrow({
      where: { hotelId, roomTypeId: suiteId },
      orderBy: { roomNumber: "asc" },
    });
    // Existing stay ends exactly on the requested check-in day.
    await createReservation({
      roomTypeId: suiteId,
      roomId: suiteRoom.id,
      resCheckIn: hotelDateToUtc("2026-10-02")!,
      resCheckOut: checkIn,
    });

    const after = (await search(suiteId))!.availableRooms;
    expect(after).toBe(before);

    const freeRooms = await availabilityService.findAvailableRooms({
      hotelId,
      roomTypeId: suiteId,
      checkIn,
      checkOut,
    });
    expect(freeRooms.map((r) => r.id)).toContain(suiteRoom.id);
  });

  it("overlapping-but-touching dates DO block (existing stay continues past check-in)", async () => {
    const before = (await search(deluxeId))!.availableRooms;
    const deluxeRoom = await prisma.room.findFirstOrThrow({
      where: { hotelId, roomTypeId: deluxeId, NOT: { status: RoomStatus.MAINTENANCE } },
      orderBy: { roomNumber: "asc" },
    });
    // Existing stay Oct 1 → Oct 6 overlaps requested Oct 5 → Oct 8.
    await createReservation({
      roomTypeId: deluxeId,
      roomId: deluxeRoom.id,
      resCheckIn: hotelDateToUtc("2026-10-01")!,
      resCheckOut: hotelDateToUtc("2026-10-06")!,
    });
    const after = (await search(deluxeId))!.availableRooms;
    expect(after).toBe(before - 1);
  });

  it("cancelled reservations do not consume capacity", async () => {
    const before = (await search(standardId))!.availableRooms;
    await createReservation({
      roomTypeId: standardId,
      status: ReservationStatus.CANCELLED,
    });
    const after = (await search(standardId))!.availableRooms;
    expect(after).toBe(before);
  });

  it("checked-out reservations do not consume capacity", async () => {
    const before = (await search(suiteId))!.availableRooms;
    await createReservation({
      roomTypeId: suiteId,
      status: ReservationStatus.CHECKED_OUT,
    });
    const after = (await search(suiteId))!.availableRooms;
    expect(after).toBe(before);
  });

  it("MAINTENANCE rooms are excluded from inventory", async () => {
    const before = (await search(standardId))!.availableRooms;
    await prisma.room.update({
      where: { id: standardRoom.id },
      data: { status: RoomStatus.MAINTENANCE },
    });
    restoredRooms.push({ id: standardRoom.id, status: RoomStatus.AVAILABLE });

    const during = (await search(standardId))!.availableRooms;
    expect(during).toBe(before - 1);

    // Restore, then verify inventory returns.
    await prisma.room.update({
      where: { id: standardRoom.id },
      data: { status: RoomStatus.AVAILABLE },
    });
    const after = (await search(standardId))!.availableRooms;
    expect(after).toBe(before);
  });

  it("validateRoomAvailability passes when capacity remains, throws when full", async () => {
    // Fill standard room type to zero available capacity.
    const standardRoomIds = (
      await prisma.room.findMany({
        where: { hotelId, roomTypeId: standardId },
        select: { id: true },
      })
    ).map((r) => r.id);
    const busyCount = await prisma.reservationRoom.count({
      where: {
        roomTypeId: standardId,
        reservation: { status: ReservationStatus.CONFIRMED, checkIn: { lt: checkOut }, checkOut: { gt: checkIn } },
      },
    });
    const toCreate = Math.max(0, standardRoomIds.length - busyCount);
    for (let i = 0; i < toCreate; i++) {
      await createReservation({ roomTypeId: standardId });
    }

    await expect(
      availabilityService.validateRoomAvailability({
        hotelId,
        roomTypeId: standardId,
        checkIn,
        checkOut,
        adults: 2,
        children: 0,
      }),
    ).rejects.toThrow(ReservationConflictError);
  });

  it("validateRoomAvailability works inside a transaction (db client)", async () => {
    await prisma.$transaction(async (tx) => {
      await availabilityService.validateRoomAvailability({
        hotelId,
        roomTypeId: deluxeId,
        checkIn: hotelDateToUtc("2026-11-02")!,
        checkOut: hotelDateToUtc("2026-11-04")!,
        adults: 2,
        children: 0,
        db: tx as Prisma.TransactionClient,
      });
    });
  });

  it("rejects guests exceeding room type capacity", async () => {
    // Suite holds max 3 adults + 2 children.
    await expect(
      availabilityService.validateRoomAvailability({
        hotelId,
        roomTypeId: suiteId,
        checkIn: hotelDateToUtc("2026-12-01")!,
        checkOut: hotelDateToUtc("2026-12-03")!,
        adults: 4,
        children: 0,
      }),
    ).rejects.toThrow(ValidationError);
  });
});
