import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { RoomStatus, UserRole, UserStatus } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/prisma";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { dashboardService } from "@/server/services/dashboard.service";
import { hotelService } from "@/server/services/hotel.service";
import { reservationService } from "@/server/services/reservation.service";
import { roomService } from "@/server/services/room.service";
import { roomTypeService } from "@/server/services/room-type.service";
import { staffService } from "@/server/services/staff.service";

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

describeDb("admin services (DB)", () => {
  let hotelId: string;
  let hotelCurrency: string;
  let adminHeaders: Headers;
  let staffHeaders: Headers;
  let adminId: string;

  const createdUserEmails: string[] = [];
  const createdRoomNumbers: string[] = [];
  const createdRoomTypeSlugs: string[] = [];
  const createdReservationIds: string[] = [];
  const restoredRooms: { id: string; status: RoomStatus }[] = [];
  const restoredSettings: { taxRate?: number; checkInTime?: string } = {};

  async function sessionHeaders(email: string, password: string): Promise<Headers> {
    // The session cookie is the SIGNED value from the sign-in response's
    // set-cookie header — the raw token alone does not resolve to a session.
    const response = await auth.api.signInEmail({
      body: { email, password },
      headers: new Headers({ origin: "http://localhost:3000" }),
      asResponse: true,
    });
    const setCookie = response.headers.get("set-cookie") ?? "";
    // Cookie name is prefixed (e.g. "better-auth.session_token" or "hms.session_token").
    const match = /([^;=]+\.session_token)=([^;]+)/.exec(setCookie);
    if (!match) throw new Error("No session cookie in sign-in response");
    return new Headers({
      cookie: `${match[1]}=${match[2]}`,
      origin: "http://localhost:3000",
    });
  }

  async function todayStr(offsetDays = 0): Promise<string> {
    const date = new Date(Date.now() + offsetDays * 86_400_000);
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
  }

  beforeAll(async () => {
    const hotel = await prisma.hotel.findFirst({ where: { slug: "grand-meridian" } });
    if (!hotel) throw new Error("Seed data missing — run `npx prisma db seed` first");
    hotelId = hotel.id;
    hotelCurrency = hotel.currency;

    // Remove artifacts from interrupted prior runs (afterAll cleanup never ran).
    // Tests below reuse fixed room numbers / slugs, so stale rows would collide.
    const staleReservations = await prisma.reservation.findMany({
      where: { guest: { email: { contains: "admin-test-" } } },
      select: { id: true },
    });
    if (staleReservations.length > 0) {
      await prisma.auditLog.deleteMany({ where: { reservationId: { in: staleReservations.map((r) => r.id) } } });
      await prisma.reservationRoom.deleteMany({
        where: { reservationId: { in: staleReservations.map((r) => r.id) } },
      });
      await prisma.reservation.deleteMany({ where: { id: { in: staleReservations.map((r) => r.id) } } });
    }
    await prisma.guest.deleteMany({ where: { email: { contains: "admin-test-" } } });
    await prisma.room.deleteMany({
      where: { hotelId, roomNumber: { in: ["999", "998", "997", "996"] } },
    });
    const staleRoomTypes = await prisma.roomType.findMany({
      where: {
        hotelId,
        OR: [
          { slug: { startsWith: "penthouse-suite" } },
          { slug: { startsWith: "garden-room" } },
          { slug: { startsWith: "standard-room-" } },
        ],
      },
      select: { id: true },
    });
    if (staleRoomTypes.length > 0) {
      await prisma.roomTypeAmenity.deleteMany({
        where: { roomTypeId: { in: staleRoomTypes.map((r) => r.id) } },
      });
      await prisma.roomType.deleteMany({ where: { id: { in: staleRoomTypes.map((r) => r.id) } } });
    }

    adminHeaders = await sessionHeaders("admin@example.com", "Admin123!");
    staffHeaders = await sessionHeaders("staff@example.com", "Staff123!");
    adminId = (await prisma.user.findUniqueOrThrow({ where: { email: "admin@example.com" } })).id;
  });

  afterAll(async () => {
    for (const email of createdUserEmails) {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        await prisma.account.deleteMany({ where: { userId: user.id } });
        await prisma.session.deleteMany({ where: { userId: user.id } });
        await prisma.auditLog.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    }
    if (createdReservationIds.length > 0) {
      await prisma.auditLog.deleteMany({ where: { reservationId: { in: createdReservationIds } } });
      await prisma.reservationRoom.deleteMany({
        where: { reservationId: { in: createdReservationIds } },
      });
      await prisma.reservation.deleteMany({ where: { id: { in: createdReservationIds } } });
      await prisma.guest.deleteMany({ where: { email: { contains: "admin-test-" } } });
    }
    for (const roomNumber of createdRoomNumbers) {
      await prisma.room.deleteMany({ where: { hotelId, roomNumber } });
    }
    for (const slug of createdRoomTypeSlugs) {
      await prisma.roomType.deleteMany({ where: { hotelId, slug } });
    }
    for (const room of restoredRooms) {
      await prisma.room.update({ where: { id: room.id }, data: { status: room.status } }).catch(() => undefined);
    }
    if (restoredSettings.taxRate !== undefined || restoredSettings.checkInTime !== undefined) {
      await prisma.hotel.update({
        where: { id: hotelId },
        data: {
          ...(restoredSettings.taxRate !== undefined ? { taxRate: restoredSettings.taxRate } : {}),
          ...(restoredSettings.checkInTime !== undefined
            ? { checkInTime: restoredSettings.checkInTime }
            : {}),
        },
      });
    }
    // Clean any sessions created by signInEmail.
    await prisma.session.deleteMany({
      where: { userId: (await prisma.user.findUniqueOrThrow({ where: { email: "admin@example.com" } })).id },
    });
  });

  // -------------------------------------------------------------------------
  // Staff management
  // -------------------------------------------------------------------------

  it("creates a staff account and the new user can sign in", async () => {
    const email = `admin-test-staff-${Date.now()}@example.com`;
    createdUserEmails.push(email);

    const user = await staffService.create(
      { name: "Test Staff", email, password: "TempPass123!", role: UserRole.STAFF },
      adminHeaders,
      adminId,
    );
    expect(user.email).toBe(email);
    expect(user.role).toBe(UserRole.STAFF);

    const dbUser = await prisma.user.findUnique({ where: { email } });
    expect(dbUser?.status).toBe(UserStatus.ACTIVE);

    const session = await auth.api.signInEmail({
      body: { email, password: "TempPass123!" },
      headers: new Headers({ origin: "http://localhost:3000" }),
    });
    expect(session.token ?? (session as { session?: { token: string } }).session?.token).toBeTruthy();
  });

  it("lists and searches staff", async () => {
    const email = `admin-test-search-${Date.now()}@example.com`;
    createdUserEmails.push(email);
    await staffService.create(
      { name: "Zeta Searchable", email, password: "TempPass123!", role: UserRole.STAFF },
      adminHeaders,
      adminId,
    );

    const all = await staffService.list({ page: 1, pageSize: 100 });
    expect(all.items.some((s) => s.email === email)).toBe(true);

    const found = await staffService.list({ search: "Zeta", page: 1, pageSize: 10 });
    expect(found.items.map((s) => s.email)).toContain(email);

    const staffOnly = await staffService.list({ role: UserRole.STAFF, page: 1, pageSize: 100 });
    expect(staffOnly.items.every((s) => s.role === UserRole.STAFF)).toBe(true);
  });

  it("updates a staff member's role and status", async () => {
    const email = `admin-test-update-${Date.now()}@example.com`;
    createdUserEmails.push(email);
    const created = await staffService.create(
      { name: "Update Me", email, password: "TempPass123!", role: UserRole.STAFF },
      adminHeaders,
      adminId,
    );

    const promoted = await staffService.update(created.id, { role: UserRole.ADMIN }, adminHeaders);
    expect(promoted.role).toBe(UserRole.ADMIN);

    const disabled = await staffService.disable(created.id, adminHeaders);
    expect(disabled.status).toBe(UserStatus.DISABLED);

    const fetched = await staffService.get(created.id);
    expect(fetched.status).toBe(UserStatus.DISABLED);
  });

  it("prevents non-admin staff from creating accounts", async () => {
    await expect(
      staffService.create(
        { name: "Nope", email: "nope@example.com", password: "TempPass123!", role: UserRole.STAFF },
        staffHeaders,
        undefined,
      ),
    ).rejects.toThrow();
    const exists = await prisma.user.findUnique({ where: { email: "nope@example.com" } });
    expect(exists).toBeNull();
  });

  it("404s for unknown staff ids", async () => {
    await expect(staffService.get("cm0000000000000000000000")).rejects.toThrow(NotFoundError);
  });

  // -------------------------------------------------------------------------
  // Room management
  // -------------------------------------------------------------------------

  it("creates a room and rejects duplicate room numbers", async () => {
    const roomType = await prisma.roomType.findFirstOrThrow({ where: { hotelId } });
    const room = await roomService.create(
      { roomTypeId: roomType.id, roomNumber: "999", floor: 9 },
      hotelId,
    );
    createdRoomNumbers.push("999");
    expect(room.roomNumber).toBe("999");

    await expect(
      roomService.create({ roomTypeId: roomType.id, roomNumber: "999" }, hotelId),
    ).rejects.toThrow(ConflictError);
  });

  it("updates room status and deletes an unreferenced room", async () => {
    const roomType = await prisma.roomType.findFirstOrThrow({ where: { hotelId } });
    const room = await roomService.create(
      { roomTypeId: roomType.id, roomNumber: "998", floor: 9 },
      hotelId,
    );
    createdRoomNumbers.push("998");

    const updated = await roomService.update(room.id, { status: RoomStatus.MAINTENANCE });
    expect(updated.status).toBe(RoomStatus.MAINTENANCE);
    await roomService.update(room.id, { status: RoomStatus.AVAILABLE });

    await roomService.delete(room.id);
    createdRoomNumbers.splice(createdRoomNumbers.indexOf("998"), 1);
    expect(await prisma.room.findUnique({ where: { id: room.id } })).toBeNull();
  });

  it("refuses to delete a room with an active reservation", async () => {
    const roomType = await prisma.roomType.findFirstOrThrow({ where: { hotelId } });
    const room = await roomService.create(
      { roomTypeId: roomType.id, roomNumber: "997", floor: 9 },
      hotelId,
    );
    createdRoomNumbers.push("997");

    const reservation = await reservationService.createReservation(
      {
        checkIn: await todayStr(30),
        checkOut: await todayStr(33),
        adults: 2,
        children: 0,
        roomTypeSlug: roomType.slug,
        guest: { firstName: "Admin", lastName: "Test", email: `admin-test-${Date.now()}@example.com` },
      },
      { hotelId, currency: hotelCurrency, taxRate: 15 },
    );
    createdReservationIds.push(reservation.id);
    await reservationService.assignRoom(reservation.id, room.id, adminId);

    await expect(roomService.delete(room.id)).rejects.toThrow(ConflictError);
  });

  // -------------------------------------------------------------------------
  // Room type management
  // -------------------------------------------------------------------------

  it("creates a room type with a generated slug and amenity links", async () => {
    const amenity = await prisma.amenity.findFirstOrThrow();
    const roomType = await roomTypeService.create(
      {
        name: "Penthouse Suite",
        capacity: 4,
        maxAdults: 4,
        maxChildren: 2,
        bedType: "1 King Bed",
        basePrice: 15000,
        amenityIds: [amenity.id],
      },
      hotelId,
    );
    createdRoomTypeSlugs.push("penthouse-suite");

    expect(roomType.slug).toBe("penthouse-suite");
    const links = await prisma.roomTypeAmenity.count({ where: { roomTypeId: roomType.id } });
    expect(links).toBe(1);
  });

  it("replaces amenity links on update and blocks delete while rooms reference it", async () => {
    const roomType = await roomTypeService.create(
      { name: "Garden Room", capacity: 2, maxAdults: 2, maxChildren: 1, bedType: "1 Queen", basePrice: 4000 },
      hotelId,
    );
    createdRoomTypeSlugs.push("garden-room");

    const [wifi, parking] = await prisma.amenity.findMany({ take: 2 });
    await roomTypeService.update(roomType.id, { amenityIds: [wifi.id, parking.id] });
    const links = await prisma.roomTypeAmenity.findMany({ where: { roomTypeId: roomType.id } });
    expect(links).toHaveLength(2);

    // Add a room → delete blocked by FK.
    const room = await roomService.create({ roomTypeId: roomType.id, roomNumber: "996", floor: 9 }, hotelId);
    createdRoomNumbers.push("996");
    await expect(roomTypeService.delete(roomType.id)).rejects.toThrow(ConflictError);
    await roomService.delete(room.id);
    createdRoomNumbers.splice(createdRoomNumbers.indexOf("996"), 1);
    await roomTypeService.delete(roomType.id);
    createdRoomTypeSlugs.splice(createdRoomTypeSlugs.indexOf("garden-room"), 1);
  });

  it("generates a unique slug for duplicate names", async () => {
    const roomType = await roomTypeService.create(
      { name: "Standard Room", capacity: 2, maxAdults: 2, maxChildren: 1, bedType: "1 Queen", basePrice: 3000 },
      hotelId,
    );
    createdRoomTypeSlugs.push("standard-room-2");
    expect(roomType.slug).toBe("standard-room-2");
  });

  // -------------------------------------------------------------------------
  // Dashboard + settings
  // -------------------------------------------------------------------------

  it("returns operational metrics including revenue for in-house stays", async () => {
    const before = await dashboardService.getMetrics(hotelId, new Date(), hotelCurrency);
    expect(before).toHaveProperty("arrivalsToday");
    expect(before).toHaveProperty("departuresToday");
    expect(before.occupancy).toHaveProperty("percentage");

    // Check a guest in for tonight → revenue today increases.
    const reservation = await reservationService.createReservation(
      {
        checkIn: await todayStr(),
        checkOut: await todayStr(1),
        adults: 2,
        children: 0,
        roomTypeSlug: "suite",
        guest: { firstName: "Rev", lastName: "Test", email: `admin-test-rev-${Date.now()}@example.com` },
      },
      { hotelId, currency: hotelCurrency, taxRate: 15 },
    );
    createdReservationIds.push(reservation.id);
    await reservationService.confirm(reservation.id, adminId);
    await reservationService.checkIn(reservation.id, adminId);

    const after = await dashboardService.getMetrics(hotelId, new Date(), hotelCurrency);
    expect(after.revenueToday.amount).toBeGreaterThan(0);
    expect(after.arrivalsToday).toBeGreaterThanOrEqual(before.arrivalsToday);
  });

  it("updates and reads hotel settings", async () => {
    const settings = await hotelService.getSettings();
    restoredSettings.taxRate = settings.taxRate;
    restoredSettings.checkInTime = settings.checkInTime;

    const updated = await hotelService.updateSettings({ taxRate: 18, checkInTime: "13:00" });
    expect(updated.taxRate).toBe(18);
    expect(updated.checkInTime).toBe("13:00");

    const reread = await hotelService.getSettings();
    expect(reread.taxRate).toBe(18);
  });
});
