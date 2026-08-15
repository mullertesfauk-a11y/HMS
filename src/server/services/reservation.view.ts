import "server-only";

import { utcToHotelDate } from "@/lib/dates";

/**
 * Public reservation view.
 *
 * The reservation entity (with guest, rooms, payments) is internal. This
 * mapper produces the minimum safe surface for guests and mobile clients:
 *  - NO internal database ids
 *  - NO contact/identity details beyond first + last name
 *  - NO payment internals (method, reference, provider data)
 *  - dates as plain "YYYY-MM-DD" (timezone-safe)
 */

export interface ReservationViewGuest {
  firstName: string;
  lastName: string;
}

export interface ReservationViewRoom {
  roomType: { name: string; slug: string };
}

export interface ReservationViewPricing {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
}

export interface PublicReservationView {
  reservationNumber: string;
  status: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  guest: ReservationViewGuest;
  rooms: ReservationViewRoom[];
  pricing: ReservationViewPricing;
  specialRequests: string | null;
  createdAt: string;
}

export function toPublicReservationView(
  reservation: {
    reservationNumber: string;
    status: string;
    checkIn: Date;
    checkOut: Date;
    adults: number;
    children: number;
    subtotal: { toNumber(): number } | number;
    tax: { toNumber(): number } | number;
    discount: { toNumber(): number } | number;
    total: { toNumber(): number } | number;
    currency: string;
    specialRequests: string | null;
    createdAt: Date;
    guest: { firstName: string; lastName: string };
    rooms: {
      roomType: { name: string; slug: string };
    }[];
  },
): PublicReservationView {
  const toNumber = (value: { toNumber(): number } | number) =>
    typeof value === "number" ? value : value.toNumber();

  return {
    reservationNumber: reservation.reservationNumber,
    status: reservation.status,
    checkIn: utcToHotelDate(reservation.checkIn),
    checkOut: utcToHotelDate(reservation.checkOut),
    nights: Math.round(
      (reservation.checkOut.getTime() - reservation.checkIn.getTime()) / 86_400_000,
    ),
    adults: reservation.adults,
    children: reservation.children,
    guest: {
      firstName: reservation.guest.firstName,
      lastName: reservation.guest.lastName,
    },
    rooms: reservation.rooms.map((room) => ({
      roomType: {
        name: room.roomType.name,
        slug: room.roomType.slug,
      },
    })),
    pricing: {
      subtotal: toNumber(reservation.subtotal),
      tax: toNumber(reservation.tax),
      discount: toNumber(reservation.discount),
      total: toNumber(reservation.total),
      currency: reservation.currency,
    },
    specialRequests: reservation.specialRequests,
    createdAt: reservation.createdAt.toISOString(),
  };
}
