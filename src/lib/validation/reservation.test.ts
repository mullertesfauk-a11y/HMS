import { describe, expect, it } from "vitest";

import { adminCreateReservationSchema, createReservationSchema } from "@/lib/validation/reservation";

const base = {
  checkIn: "2026-09-01",
  checkOut: "2026-09-03",
  adults: 2,
  children: 0,
  roomTypeSlug: "suite",
  guest: { firstName: "Ada", lastName: "Lovelace", email: "ada@example.com" },
};

describe("createReservationSchema", () => {
  it("accepts a booking without a physical room (public flow)", () => {
    const result = createReservationSchema.safeParse(base);
    expect(result.success).toBe(true);
  });

  it("accepts an optional roomId", () => {
    const result = createReservationSchema.safeParse({ ...base, roomId: "room-123" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.roomId).toBe("room-123");
  });
});

describe("adminCreateReservationSchema", () => {
  it("requires a physical room for walk-in bookings", () => {
    const result = adminCreateReservationSchema.safeParse(base);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.includes("roomId"))).toBe(true);
    }
  });

  it("accepts a booking with a roomId", () => {
    const result = adminCreateReservationSchema.safeParse({ ...base, roomId: "room-123" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.roomId).toBe("room-123");
  });

  it("defaults checkInNow to true for walk-in bookings", () => {
    const result = adminCreateReservationSchema.safeParse({ ...base, roomId: "room-123" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.checkInNow).toBe(true);
  });

  it("allows checkInNow to be disabled for advance desk bookings", () => {
    const result = adminCreateReservationSchema.safeParse({
      ...base,
      roomId: "room-123",
      checkInNow: false,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.checkInNow).toBe(false);
  });
});
