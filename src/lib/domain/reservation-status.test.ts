import { describe, expect, it } from "vitest";

import { ReservationStatus } from "@/generated/prisma/client";
import { InvalidReservationStateError } from "@/lib/errors";
import {
  ACTIVE_BOOKING_STATUSES,
  canTransition,
  CANCELLABLE_STATUSES,
  isCancellable,
  transitionReservationStatus,
} from "@/lib/domain/reservation-status";

const {
  PENDING,
  CONFIRMED,
  CHECKED_IN,
  CHECKED_OUT,
  CANCELLED,
  NO_SHOW,
} = ReservationStatus;

describe("reservation state machine", () => {
  it("allows every valid transition", () => {
    expect(canTransition(PENDING, CONFIRMED)).toBe(true);
    expect(canTransition(PENDING, CANCELLED)).toBe(true);
    expect(canTransition(CONFIRMED, CHECKED_IN)).toBe(true);
    expect(canTransition(CONFIRMED, CANCELLED)).toBe(true);
    expect(canTransition(CONFIRMED, NO_SHOW)).toBe(true);
    expect(canTransition(CHECKED_IN, CHECKED_OUT)).toBe(true);
  });

  it("rejects invalid transitions", () => {
    expect(canTransition(CHECKED_OUT, PENDING)).toBe(false);
    expect(canTransition(CHECKED_OUT, CONFIRMED)).toBe(false);
    expect(canTransition(CANCELLED, CHECKED_IN)).toBe(false);
    expect(canTransition(CANCELLED, PENDING)).toBe(false);
    expect(canTransition(PENDING, CHECKED_IN)).toBe(false);
    expect(canTransition(PENDING, NO_SHOW)).toBe(false);
    expect(canTransition(CHECKED_IN, CONFIRMED)).toBe(false);
    expect(canTransition(CONFIRMED, PENDING)).toBe(false);
    expect(canTransition(NO_SHOW, PENDING)).toBe(false);
  });

  it("transitionReservationStatus returns the target status on success", () => {
    expect(transitionReservationStatus(PENDING, CONFIRMED)).toBe(CONFIRMED);
    expect(transitionReservationStatus(CONFIRMED, CHECKED_IN)).toBe(CHECKED_IN);
  });

  it("transitionReservationStatus throws InvalidReservationStateError otherwise", () => {
    expect(() => transitionReservationStatus(CHECKED_OUT, PENDING)).toThrow(
      InvalidReservationStateError,
    );
    expect(() => transitionReservationStatus(CANCELLED, CHECKED_IN)).toThrow(
      InvalidReservationStateError,
    );
  });

  it("only PENDING/CONFIRMED are cancellable", () => {
    expect(isCancellable(PENDING)).toBe(true);
    expect(isCancellable(CONFIRMED)).toBe(true);
    expect(isCancellable(CHECKED_IN)).toBe(false);
    expect(isCancellable(CHECKED_OUT)).toBe(false);
    expect(isCancellable(CANCELLED)).toBe(false);
    expect(isCancellable(NO_SHOW)).toBe(false);
  });

  it("active booking statuses are exactly those occupying inventory", () => {
    expect([...ACTIVE_BOOKING_STATUSES].sort()).toEqual(
      [PENDING, CONFIRMED, CHECKED_IN].sort(),
    );
    expect(ACTIVE_BOOKING_STATUSES).not.toContain(CANCELLED);
    expect(ACTIVE_BOOKING_STATUSES).not.toContain(CHECKED_OUT);
    expect(ACTIVE_BOOKING_STATUSES).not.toContain(NO_SHOW);
    expect([...CANCELLABLE_STATUSES].sort()).toEqual([PENDING, CONFIRMED].sort());
  });
});
