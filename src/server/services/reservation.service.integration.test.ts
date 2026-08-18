import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ReservationStatus, RoomStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { hotelDateToUtc } from "@/lib/dates";
import {
  ConflictError,
  InvalidReservationStateError,
  NotFoundError,
  ReservationConflictError,
  ValidationError,
} from "@/lib/errors";
import { reservationService } from "@/server/services/reservation.service";
import { availabilityService } from "@/server/services/availability.service";

/**
 * Reservation domain service integration tests — require a live, seeded
 * database. Skipped when DATABASE_URL is not configured. All created rows are
 * cleaned up afterwards. Each test uses its own date window so tests never
 * block each other's availability.
 */

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

describeDb("reservation service (DB)", () => {
  let hotelId: string;
  let hotelCurrency: string;
  let suiteId: string;
  let deluxeId: string;
  let standardId: string;
  let deluxeRooms: { id: string; roomNumber: string }[];
  let standardRoom: { id: string; roomNumber: string };
  let actorId: string;

  const createdReservationIds: string[] = [];

  const ctx = {
    hotelId: "",
    currency: "ETB",
    taxRate: 15,
    ipAddress: "127.0.0.1",
    userAgent: "vitest",
  };

  const guestEmail = (tag: string) => `rsv-test-${tag}-${randomUUID().slice(0, 6)}@example.com`;

  async function createReservation(overrides?: {
    roomTypeSlug?: string;
    email?: string;
    taxRate?: number;
    adults?: number;
    children?: number;
    checkIn?: string;
    checkOut?: string;
    roomId?: string;
    createdById?: string;
    checkInNow?: boolean;
  }): Promise<Awaited<ReturnType<typeof reservationService.createReservation>>> {
    const reservation = await reservationService.createReservation(
      {
        checkIn: overrides?.checkIn ?? "2027-01-15",
        checkOut: overrides?.checkOut ?? "2027-01-18",
        adults: overrides?.adults ?? 2,
        children: overrides?.children ?? 0,
        roomTypeSlug: overrides?.roomTypeSlug ?? "suite",
        ...(overrides?.roomId ? { roomId: overrides.roomId } : {}),
        guest: {
          firstName: "Rsv",
          lastName: "Test",
          email: overrides?.email ?? guestEmail("main"),
        },
      },
      {
        hotelId,
        currency: hotelCurrency,
        taxRate: overrides?.taxRate ?? ctx.taxRate,
        createdById: overrides?.createdById,
        checkInNow: overrides?.checkInNow,
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
      },
    );
    createdReservationIds.push(reservation.id);
    return reservation;
  }

  async function suiteAvailability() {
    const results = await availabilityService.searchAvailability({
      hotelId,
      checkIn: hotelDateToUtc("2027-01-15")!,
      checkOut: hotelDateToUtc("2027-01-18")!,
      adults: 2,
      children: 0,
    });
    return results.find((r) => r.id === suiteId)!.availableRooms;
  }

  beforeAll(async () => {
    const hotel = await prisma.hotel.findFirst({ where: { slug: "grand-meridian" } });
    if (!hotel) throw new Error("Seed data missing — run `npx prisma db seed` first");
    hotelId = hotel.id;
    hotelCurrency = hotel.currency;
    ctx.hotelId = hotel.id;

    const [suite, deluxe, standard] = await Promise.all([
      prisma.roomType.findFirst({ where: { hotelId, slug: "suite" } }),
      prisma.roomType.findFirst({ where: { hotelId, slug: "deluxe-room" } }),
      prisma.roomType.findFirst({ where: { hotelId, slug: "standard-room" } }),
    ]);
    if (!suite || !deluxe || !standard) {
      throw new Error("Seed room types missing — run `npx prisma db seed` first");
    }
    suiteId = suite.id;
    deluxeId = deluxe.id;
    standardId = standard.id;

    deluxeRooms = await prisma.room.findMany({
      where: { hotelId, roomTypeId: deluxeId },
      orderBy: { roomNumber: "asc" },
      select: { id: true, roomNumber: true },
    });
    standardRoom = await prisma.room.findFirstOrThrow({
      where: { hotelId, roomTypeId: standardId },
      orderBy: { roomNumber: "asc" },
      select: { id: true, roomNumber: true },
    });
    // Real user id — audit log rows have a User FK.
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: "admin@example.com" } });
    actorId = admin.id;
  });

  afterAll(async () => {
    // Robust cleanup: also catch any reservation orphaned by a timed-out test.
    const orphaned = await prisma.reservation.findMany({
      where: { guest: { email: { contains: "rsv-test-" } } },
      select: { id: true },
    });
    const ids = [...new Set([...createdReservationIds, ...orphaned.map((r) => r.id)])];
    if (ids.length > 0) {
      await prisma.auditLog.deleteMany({ where: { reservationId: { in: ids } } });
      await prisma.reservationRoom.deleteMany({ where: { reservationId: { in: ids } } });
      await prisma.reservation.deleteMany({ where: { id: { in: ids } } });
    }
    await prisma.guest.deleteMany({ where: { email: { contains: "rsv-test-" } } });
  });

  it("creates a PENDING reservation with server-computed pricing, number, guest, payment and audit", async () => {
    const before = await suiteAvailability();
    const reservation = await createReservation({ email: guestEmail("happy") });

    // Reservation shape
    expect(reservation.status).toBe(ReservationStatus.PENDING);
    expect(reservation.reservationNumber).toMatch(/^HTL-\d{4}-[2-9A-HJKMNP-Z]{6}$/);
    expect(reservation.checkIn).toEqual(hotelDateToUtc("2027-01-15"));
    expect(reservation.checkOut).toEqual(hotelDateToUtc("2027-01-18"));
    expect(reservation.createdById).toBeNull();

    // Server-computed pricing: suite base 8500 × 3 nights, 15% tax
    expect(reservation.subtotal.toNumber()).toBe(25500);
    expect(reservation.tax.toNumber()).toBe(3825);
    expect(reservation.discount.toNumber()).toBe(0);
    expect(reservation.total.toNumber()).toBe(29325);
    expect(reservation.currency).toBe(hotelCurrency);

    // Room line: room type only, no physical room assigned
    expect(reservation.rooms).toHaveLength(1);
    expect(reservation.rooms[0]!.roomType.slug).toBe("suite");
    expect(reservation.rooms[0]!.roomId).toBeNull();
    expect(reservation.rooms[0]!.numberOfNights).toBe(3);
    expect(reservation.rooms[0]!.pricePerNight.toNumber()).toBe(8500);

    // Guest
    expect(reservation.guest.firstName).toBe("Rsv");
    expect(reservation.guest.email).toContain("rsv-test-happy");

    // PENDING payment for the full total
    expect(reservation.payments).toHaveLength(1);
    expect(reservation.payments[0]!.status).toBe("PENDING");
    expect(reservation.payments[0]!.amount.toNumber()).toBe(29325);
    expect(reservation.payments[0]!.method).toBe("ONLINE");

    // Audit entries were written
    const audit = await prisma.auditLog.findMany({
      where: { reservationId: reservation.id },
      select: { action: true },
    });
    expect(audit.map((a) => a.action)).toContain("reservation.created");

    // Availability decremented by one
    expect(await suiteAvailability()).toBe(before - 1);
  });

  it("rejects guest counts above room type capacity without creating anything", async () => {
    const beforeCount = await prisma.reservation.count();
    const beforeGuests = await prisma.guest.count({ where: { email: { contains: "rsv-test-" } } });

    await expect(
      createReservation({
        email: guestEmail("capacity"),
        adults: 4, // suite maxAdults is 3
        checkIn: "2027-01-25",
        checkOut: "2027-01-28",
      }),
    ).rejects.toThrow(ValidationError);

    expect(await prisma.reservation.count()).toBe(beforeCount);
    expect(await prisma.guest.count({ where: { email: { contains: "rsv-test-" } } })).toBe(
      beforeGuests,
    );
  });

  it(
    "rolls back completely when the room type is sold out (concurrent-booking protection)",
    async () => {
    // Fill the standard room type (3 rooms) for a date window.
    for (let i = 0; i < 3; i++) {
      await createReservation({
        roomTypeSlug: "standard-room",
        email: guestEmail(`fill-${i}`),
        checkIn: "2027-02-01",
        checkOut: "2027-02-04",
      });
    }
    const beforeReservations = await prisma.reservation.count();
    const beforeGuests = await prisma.guest.count({ where: { email: { contains: "rsv-test-" } } });

    // The 4th booking for the same window must fail…
    await expect(
      createReservation({
        roomTypeSlug: "standard-room",
        email: guestEmail("overflow"),
        checkIn: "2027-02-01",
        checkOut: "2027-02-04",
      }),
    ).rejects.toThrow(ReservationConflictError);

      // …and leave NO trace behind (transaction rolled back).
      expect(await prisma.reservation.count()).toBe(beforeReservations);
      expect(await prisma.guest.count({ where: { email: { contains: "rsv-test-" } } })).toBe(
        beforeGuests,
      );
    },
    90_000,
  );

  it("dedupes guests by email", async () => {
    const email = guestEmail("dedupe");
    const first = await createReservation({ email, checkIn: "2027-02-10", checkOut: "2027-02-13" });
    const second = await createReservation({ email, checkIn: "2027-02-14", checkOut: "2027-02-17" });

    expect(first.guest.id).toBe(second.guest.id);
    const count = await prisma.guest.count({ where: { email } });
    expect(count).toBe(1);
  });

  it("looks up reservations by number + last name and hides mismatches", async () => {
    const reservation = await createReservation({ email: guestEmail("lookup") });

    const found = await reservationService.lookup({
      reservationNumber: reservation.reservationNumber,
      lastName: "test", // case-insensitive
    });
    expect(found.reservationNumber).toBe(reservation.reservationNumber);

    await expect(
      reservationService.lookup({
        reservationNumber: reservation.reservationNumber,
        lastName: "wrong",
      }),
    ).rejects.toThrow(NotFoundError);
  });

  it("cancels a PENDING reservation and frees availability", async () => {
    const checkIn = "2027-02-20";
    const checkOut = "2027-02-23";
    const before = (
      await availabilityService.searchAvailability({
        hotelId,
        checkIn: hotelDateToUtc(checkIn)!,
        checkOut: hotelDateToUtc(checkOut)!,
        adults: 2,
        children: 0,
      })
    ).find((r) => r.id === deluxeId)!.availableRooms;

    const reservation = await createReservation({
      roomTypeSlug: "deluxe-room",
      email: guestEmail("cancel"),
      checkIn,
      checkOut,
    });
    expect(
      (
        await availabilityService.searchAvailability({
          hotelId,
          checkIn: hotelDateToUtc(checkIn)!,
          checkOut: hotelDateToUtc(checkOut)!,
          adults: 2,
          children: 0,
        })
      ).find((r) => r.id === deluxeId)!.availableRooms,
    ).toBe(before - 1);

    const cancelled = await reservationService.cancelPublic(
      { reservationNumber: reservation.reservationNumber, lastName: "Test" },
      { ipAddress: ctx.ipAddress },
    );
    expect(cancelled.status).toBe(ReservationStatus.CANCELLED);
    expect(cancelled.cancelledAt).toBeInstanceOf(Date);

    // Availability restored.
    expect(
      (
        await availabilityService.searchAvailability({
          hotelId,
          checkIn: hotelDateToUtc(checkIn)!,
          checkOut: hotelDateToUtc(checkOut)!,
          adults: 2,
          children: 0,
        })
      ).find((r) => r.id === deluxeId)!.availableRooms,
    ).toBe(before);
  });

  it("cannot cancel a checked-in reservation", async () => {
    const reservation = await createReservation({
      roomTypeSlug: "deluxe-room",
      email: guestEmail("no-cancel"),
      checkIn: "2027-03-01",
      checkOut: "2027-03-04",
    });
    await reservationService.confirm(reservation.id);
    await reservationService.checkIn(reservation.id);

    await expect(
      reservationService.cancelPublic(
        { reservationNumber: reservation.reservationNumber, lastName: "Test" },
        { ipAddress: ctx.ipAddress },
      ),
    ).rejects.toThrow(InvalidReservationStateError);
  });

  it("follows the state machine: PENDING → CONFIRMED → CHECKED_IN → CHECKED_OUT, and NO_SHOW from CONFIRMED", async () => {
    const reservation = await createReservation({
      roomTypeSlug: "deluxe-room",
      email: guestEmail("chain"),
      checkIn: "2027-03-10",
      checkOut: "2027-03-13",
    });

    const confirmed = await reservationService.confirm(reservation.id, actorId);
    expect(confirmed.status).toBe(ReservationStatus.CONFIRMED);

    const checkedIn = await reservationService.checkIn(reservation.id, actorId);
    expect(checkedIn.status).toBe(ReservationStatus.CHECKED_IN);

    const checkedOut = await reservationService.checkOut(reservation.id, actorId);
    expect(checkedOut.status).toBe(ReservationStatus.CHECKED_OUT);

    // Invalid: CHECKED_OUT → PENDING must throw.
    await expect(
      reservationService.confirm(reservation.id, actorId),
    ).rejects.toThrow(InvalidReservationStateError);

    // NO_SHOW path from CONFIRMED.
    const noShow = await createReservation({
      roomTypeSlug: "deluxe-room",
      email: guestEmail("noshow"),
      checkIn: "2027-03-15",
      checkOut: "2027-03-18",
    });
    await reservationService.confirm(noShow.id, actorId);
    const marked = await reservationService.markNoShow(noShow.id, actorId);
    expect(marked.status).toBe(ReservationStatus.NO_SHOW);
  });

  it("assigns a physical room to a reservation", async () => {
    const reservation = await createReservation({
      roomTypeSlug: "deluxe-room",
      email: guestEmail("assign"),
      checkIn: "2027-04-01",
      checkOut: "2027-04-04",
    });
    expect(reservation.rooms[0]!.roomId).toBeNull();

    const updated = await reservationService.assignRoom(
      reservation.id,
      deluxeRooms[0]!.id,
      actorId,
    );
    expect(updated.rooms[0]!.roomId).toBe(deluxeRooms[0]!.id);
  });

  it("refuses to assign an already-booked room but allows a free one", async () => {
    const a = await createReservation({
      roomTypeSlug: "deluxe-room",
      email: guestEmail("busy-a"),
      checkIn: "2027-04-10",
      checkOut: "2027-04-13",
    });
    const b = await createReservation({
      roomTypeSlug: "deluxe-room",
      email: guestEmail("busy-b"),
      checkIn: "2027-04-10",
      checkOut: "2027-04-13",
    });
    await reservationService.assignRoom(a.id, deluxeRooms[0]!.id, actorId);

    await expect(
      reservationService.assignRoom(b.id, deluxeRooms[0]!.id, actorId),
    ).rejects.toThrow(ReservationConflictError);

    const assigned = await reservationService.assignRoom(b.id, deluxeRooms[1]!.id, actorId);
    expect(assigned.rooms[0]!.roomId).toBe(deluxeRooms[1]!.id);
  });

  it("refuses to assign a room of the wrong type", async () => {
    const suiteRes = await createReservation({
      roomTypeSlug: "suite",
      email: guestEmail("wrong-type"),
      checkIn: "2027-04-20",
      checkOut: "2027-04-23",
    });
    await expect(
      reservationService.assignRoom(suiteRes.id, standardRoom.id, actorId),
    ).rejects.toThrow(ConflictError);
  });

  it("refuses to assign a room to a checked-in reservation", async () => {
    const checkedIn = await createReservation({
      roomTypeSlug: "deluxe-room",
      email: guestEmail("checked-in-assign"),
      checkIn: "2027-04-25",
      checkOut: "2027-04-28",
    });
    await reservationService.confirm(checkedIn.id, actorId);
    await reservationService.checkIn(checkedIn.id, actorId);
    await expect(
      reservationService.assignRoom(checkedIn.id, deluxeRooms[2]!.id, actorId),
    ).rejects.toThrow(InvalidReservationStateError);
  });

  // -------------------------------------------------------------------------
  // Walk-in bookings: reservation creation with a pre-assigned room
  // -------------------------------------------------------------------------

  it("creates a reservation with a pre-assigned room and staff attribution", async () => {
    const reservation = await createReservation({
      roomTypeSlug: "deluxe-room",
      email: guestEmail("walkin"),
      checkIn: "2027-05-01",
      checkOut: "2027-05-04",
      roomId: deluxeRooms[0]!.id,
      createdById: actorId,
    });

    expect(reservation.status).toBe(ReservationStatus.PENDING);
    expect(reservation.createdById).toBe(actorId);
    expect(reservation.rooms[0]!.roomId).toBe(deluxeRooms[0]!.id);
    expect(reservation.rooms[0]!.room?.roomNumber).toBe(deluxeRooms[0]!.roomNumber);
  });

  it("refuses to pre-assign a room that is already booked for the stay", async () => {
    const checkIn = "2027-05-10";
    const checkOut = "2027-05-13";
    const first = await createReservation({
      roomTypeSlug: "deluxe-room",
      email: guestEmail("walkin-busy-a"),
      checkIn,
      checkOut,
      roomId: deluxeRooms[0]!.id,
    });
    expect(first.rooms[0]!.roomId).toBe(deluxeRooms[0]!.id);

    await expect(
      createReservation({
        roomTypeSlug: "deluxe-room",
        email: guestEmail("walkin-busy-b"),
        checkIn,
        checkOut,
        roomId: deluxeRooms[0]!.id,
      }),
    ).rejects.toThrow(ReservationConflictError);
  });

  it("refuses to pre-assign a room of the wrong type", async () => {
    await expect(
      createReservation({
        roomTypeSlug: "suite",
        email: guestEmail("walkin-wrong-type"),
        checkIn: "2027-05-20",
        checkOut: "2027-05-23",
        roomId: standardRoom.id,
      }),
    ).rejects.toThrow(ConflictError);
  });

  it("refuses to pre-assign a maintenance room", async () => {
    const maintenanceRoom = await prisma.room.create({
      data: {
        hotelId,
        roomTypeId: standardId,
        roomNumber: `MT-${randomUUID().slice(0, 4)}`,
        status: RoomStatus.MAINTENANCE,
      },
    });
    try {
      await expect(
        createReservation({
          roomTypeSlug: "standard-room",
          email: guestEmail("walkin-maint"),
          checkIn: "2027-05-25",
          checkOut: "2027-05-28",
          roomId: maintenanceRoom.id,
        }),
      ).rejects.toThrow(ReservationConflictError);
    } finally {
      await prisma.room.delete({ where: { id: maintenanceRoom.id } });
    }
  });

  it("creates a walk-in reservation already checked in when checkInNow is set", async () => {
    const checkIn = "2027-06-01";
    const checkOut = "2027-06-04";
    const before = (
      await availabilityService.searchAvailability({
        hotelId,
        checkIn: hotelDateToUtc(checkIn)!,
        checkOut: hotelDateToUtc(checkOut)!,
        adults: 2,
        children: 0,
      })
    ).find((r) => r.id === deluxeId)!.availableRooms;

    const reservation = await createReservation({
      roomTypeSlug: "deluxe-room",
      email: guestEmail("walkin-now"),
      checkIn,
      checkOut,
      roomId: deluxeRooms[0]!.id,
      createdById: actorId,
      checkInNow: true,
    });

    expect(reservation.status).toBe(ReservationStatus.CHECKED_IN);
    expect(reservation.rooms[0]!.roomId).toBe(deluxeRooms[0]!.id);
    // CHECKED_IN stays occupy inventory exactly like any other active booking.
    const after = (
      await availabilityService.searchAvailability({
        hotelId,
        checkIn: hotelDateToUtc(checkIn)!,
        checkOut: hotelDateToUtc(checkOut)!,
        adults: 2,
        children: 0,
      })
    ).find((r) => r.id === deluxeId)!.availableRooms;
    expect(after).toBe(before - 1);
  });
});
