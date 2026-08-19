import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db/prisma";
import {
  cancelReservation,
  createBooking,
  lookupReservation,
} from "@/app/[locale]/(website)/actions";

const describeDb = process.env.DATABASE_URL ? describe : describe.skip;

describeDb("public website actions (DB)", () => {
  const createdNumbers: string[] = [];

  async function todayStr(offsetDays = 0): Promise<string> {
    const date = new Date(Date.now() + offsetDays * 86_400_000);
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(
      date.getUTCDate(),
    ).padStart(2, "0")}`;
  }

  beforeAll(async () => {
    const hotel = await prisma.hotel.findFirst({ where: { slug: "grand-meridian" } });
    if (!hotel) throw new Error("Seed data missing — run `npx prisma db seed` first");
    // Clean leftovers from interrupted runs.
    const stale = await prisma.reservation.findMany({
      where: { guest: { email: { contains: "website-test-" } } },
      select: { id: true },
    });
    if (stale.length > 0) {
      await prisma.auditLog.deleteMany({ where: { reservationId: { in: stale.map((r) => r.id) } } });
      await prisma.reservationRoom.deleteMany({
        where: { reservationId: { in: stale.map((r) => r.id) } },
      });
      await prisma.reservation.deleteMany({ where: { id: { in: stale.map((r) => r.id) } } });
    }
    await prisma.guest.deleteMany({ where: { email: { contains: "website-test-" } } });
  });

  afterAll(async () => {
    if (createdNumbers.length > 0) {
      const created = await prisma.reservation.findMany({
        where: { reservationNumber: { in: createdNumbers } },
        select: { id: true },
      });
      if (created.length > 0) {
        await prisma.auditLog.deleteMany({
          where: { reservationId: { in: created.map((r) => r.id) } },
        });
        await prisma.reservationRoom.deleteMany({
          where: { reservationId: { in: created.map((r) => r.id) } },
        });
        await prisma.reservation.deleteMany({ where: { id: { in: created.map((r) => r.id) } } });
      }
    }
    await prisma.guest.deleteMany({ where: { email: { contains: "website-test-" } } });
    await prisma.$disconnect();
  });

  it("creates a booking with server pricing", async () => {
    const email = `website-test-${Date.now()}@example.com`;
    const result = await createBooking({
      checkIn: await todayStr(45),
      checkOut: await todayStr(48),
      adults: 2,
      children: 1,
      roomTypeSlug: "suite",
      guest: {
        firstName: "Web",
        lastName: "Tester",
        email,
        phone: "+251 9 000 0000",
        country: "Ethiopia",
      },
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    createdNumbers.push(result.reservation.reservationNumber);

    expect(result.reservation.rooms[0]?.roomType.slug).toBe("suite");
    expect(result.reservation.nights).toBe(3);
    expect(result.reservation.status).toBe("PENDING");
    expect(result.reservation.pricing.total).toBeGreaterThan(0);
    expect(result.reservation.pricing.currency).toBe("ETB");
  });

  it("looks up by number + last name", async () => {
    const email = `website-test-lookup-${Date.now()}@example.com`;
    const created = await createBooking({
      checkIn: await todayStr(60),
      checkOut: await todayStr(62),
      adults: 1,
      children: 0,
      roomTypeSlug: "standard-room",
      guest: { firstName: "Find", lastName: "Me", email },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    createdNumbers.push(created.reservation.reservationNumber);

    const found = await lookupReservation({
      reservationNumber: created.reservation.reservationNumber,
      lastName: "me",
    });
    expect(found.ok).toBe(true);
    if (!found.ok) return;
    expect(found.reservation.reservationNumber).toBe(created.reservation.reservationNumber);
    expect(found.reservation.guest.lastName).toBe("Me");
  });

  it("rejects lookup with the wrong last name", async () => {
    const email = `website-test-nope-${Date.now()}@example.com`;
    const created = await createBooking({
      checkIn: await todayStr(70),
      checkOut: await todayStr(72),
      adults: 1,
      children: 0,
      roomTypeSlug: "deluxe-room",
      guest: { firstName: "Wrong", lastName: "Person", email },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    createdNumbers.push(created.reservation.reservationNumber);

    const found = await lookupReservation({
      reservationNumber: created.reservation.reservationNumber,
      lastName: "Nobody",
    });
    expect(found.ok).toBe(false);
    if (found.ok) return;
    expect(found.error).toMatch(/not found/i);
  });

  it("cancels a pending booking", async () => {
    const email = `website-test-cancel-${Date.now()}@example.com`;
    const created = await createBooking({
      checkIn: await todayStr(80),
      checkOut: await todayStr(83),
      adults: 2,
      children: 0,
      roomTypeSlug: "suite",
      guest: { firstName: "Cancel", lastName: "Now", email },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    createdNumbers.push(created.reservation.reservationNumber);

    const cancelled = await cancelReservation({
      reservationNumber: created.reservation.reservationNumber,
      lastName: "Now",
    });
    expect(cancelled.ok).toBe(true);
    if (!cancelled.ok) return;
    expect(cancelled.reservation.status).toBe("CANCELLED");
  });

  it("rejects a booking for an invalid room type slug", async () => {
    const result = await createBooking({
      checkIn: await todayStr(90),
      checkOut: await todayStr(92),
      adults: 1,
      children: 0,
      roomTypeSlug: "does-not-exist",
      guest: { firstName: "Ghost", lastName: "Room", email: `website-test-ghost-${Date.now()}@example.com` },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBeTruthy();
  });

  it("rejects invalid dates via validation", async () => {
    const result = await createBooking({
      checkIn: "2026-01-01",
      checkOut: "2025-12-31",
      adults: 1,
      children: 0,
      roomTypeSlug: "suite",
      guest: { firstName: "Bad", lastName: "Dates", email: `website-test-dates-${Date.now()}@example.com` },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/checkIn must be before checkOut/i);
  });
});
