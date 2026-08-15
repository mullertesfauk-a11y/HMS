import "server-only";

import { PaymentStatus } from "@/generated/prisma/client";
import type { ReservationRow } from "@/components/admin/reservations/reservation-columns";

/** Map a repository list item (with guest/rooms/payments) to a table row. */
export function toAdminReservationRow(item: {
  id: string;
  reservationNumber: string;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  children: number;
  total: { toNumber(): number };
  status: string;
  createdAt: Date;
  guest: { firstName: string; lastName: string; email: string | null };
  rooms: {
    roomType: { name: string };
    room: { roomNumber: string } | null;
  }[];
  payments: { status: string }[];
}): ReservationRow {
  const roomLine = item.rooms[0];
  const payment =
    item.payments.find((p) => p.status !== PaymentStatus.PENDING) ?? item.payments[0];
  return {
    id: item.id,
    reservationNumber: item.reservationNumber,
    guestName: `${item.guest.firstName} ${item.guest.lastName}`.trim(),
    guestEmail: item.guest.email ?? "",
    checkIn: formatDateOnly(item.checkIn),
    checkOut: formatDateOnly(item.checkOut),
    roomTypeName: roomLine?.roomType.name ?? "—",
    roomNumber: roomLine?.room?.roomNumber ?? null,
    adults: item.adults,
    children: item.children,
    total: item.total.toNumber(),
    status: item.status,
    paymentStatus: payment?.status ?? PaymentStatus.PENDING,
    createdAt: item.createdAt.toISOString(),
  };
}

function formatDateOnly(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
