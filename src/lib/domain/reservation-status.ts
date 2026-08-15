import "server-only";

import { ReservationStatus } from "@/generated/prisma/client";

import { InvalidReservationStateError } from "@/lib/errors";

/**
 * Reservation state machine.
 *
 * The ONLY place reservation status transitions are defined. Services must
 * call `transitionReservationStatus` instead of assigning status freely.
 *
 * Valid transitions:
 *   PENDING     → CONFIRMED, CANCELLED
 *   CONFIRMED   → CHECKED_IN, CANCELLED, NO_SHOW
 *   CHECKED_IN  → CHECKED_OUT
 */

export const RESERVATION_TRANSITIONS: Record<ReservationStatus, readonly ReservationStatus[]> = {
  [ReservationStatus.PENDING]: [ReservationStatus.CONFIRMED, ReservationStatus.CANCELLED],
  [ReservationStatus.CONFIRMED]: [
    ReservationStatus.CHECKED_IN,
    ReservationStatus.CANCELLED,
    ReservationStatus.NO_SHOW,
  ],
  [ReservationStatus.CHECKED_IN]: [ReservationStatus.CHECKED_OUT],
  [ReservationStatus.CHECKED_OUT]: [],
  [ReservationStatus.CANCELLED]: [],
  [ReservationStatus.NO_SHOW]: [],
};

export function canTransition(from: ReservationStatus, to: ReservationStatus): boolean {
  return RESERVATION_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Statuses from which a reservation may be cancelled. */
export const CANCELLABLE_STATUSES: readonly ReservationStatus[] = [
  ReservationStatus.PENDING,
  ReservationStatus.CONFIRMED,
];

/**
 * Statuses that occupy inventory (block availability). CANCELLED, NO_SHOW and
 * CHECKED_OUT reservations free their rooms/capacity.
 */
export const ACTIVE_BOOKING_STATUSES: readonly ReservationStatus[] = [
  ReservationStatus.PENDING,
  ReservationStatus.CONFIRMED,
  ReservationStatus.CHECKED_IN,
];

export function isCancellable(status: ReservationStatus): boolean {
  return CANCELLABLE_STATUSES.includes(status);
}

/**
 * Validate a transition; returns the target status on success and throws
 * InvalidReservationStateError otherwise.
 */
export function transitionReservationStatus(
  from: ReservationStatus,
  to: ReservationStatus,
): ReservationStatus {
  if (!canTransition(from, to)) {
    throw new InvalidReservationStateError(
      `Cannot transition reservation from ${from} to ${to}`,
    );
  }
  return to;
}
