import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { GuestHistory } from "@/components/admin/guests/guest-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReservationRow } from "@/components/admin/reservations/reservation-columns";
import { requirePermissionPage } from "@/lib/permissions";
import { PaymentStatus } from "@/generated/prisma/client";
import { guestService } from "@/server/services/guest.service";
import { hotelService } from "@/server/services/hotel.service";
import { formatDateTime } from "@/lib/utils/display";

function formatDateOnly(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toHistoryRow(
  reservation: {
    id: string;
    reservationNumber: string;
    checkIn: Date;
    checkOut: Date;
    adults: number;
    children: number;
    total: { toNumber(): number };
    status: string;
    createdAt: Date;
    rooms: {
      roomType: { name: string };
      room: { roomNumber: string } | null;
    }[];
  },
  guest: { firstName: string; lastName: string; email: string | null },
): ReservationRow {
  const roomLine = reservation.rooms[0];
  return {
    id: reservation.id,
    reservationNumber: reservation.reservationNumber,
    guestName: `${guest.firstName} ${guest.lastName}`.trim(),
    guestEmail: guest.email ?? "",
    checkIn: formatDateOnly(reservation.checkIn),
    checkOut: formatDateOnly(reservation.checkOut),
    roomTypeName: roomLine?.roomType.name ?? "—",
    roomNumber: roomLine?.room?.roomNumber ?? null,
    adults: reservation.adults,
    children: reservation.children,
    total: reservation.total.toNumber(),
    status: reservation.status,
    paymentStatus: PaymentStatus.PENDING,
    createdAt: reservation.createdAt.toISOString(),
  };
}

export default async function GuestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage("guests.read");
  const hotel = await hotelService.getDefaultHotel();
  const { id } = await params;

  const history = await guestService.getWithHistory(id);
  if (!history) notFound();

  const guest = {
    firstName: history.firstName,
    lastName: history.lastName,
    email: history.email,
  };
  const upcoming = history.upcoming.map((reservation) => toHistoryRow(reservation, guest));
  const previous = history.previous.map((reservation) => toHistoryRow(reservation, guest));

  return (
    <div className="space-y-5">
      <Link
        href="/admin/guests"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        Back to guests
      </Link>

      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {history.firstName} {history.lastName}
        </h1>
        <p className="mt-0.5 text-sm text-stone-500">
          {history.email ?? "No email on file"} · Guest since {formatDateTime(history.createdAt)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {history.totalStays}
            </p>
            <p className="mt-0.5 text-sm text-stone-600">Completed stays</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {upcoming.length}
            </p>
            <p className="mt-0.5 text-sm text-stone-600">Upcoming reservations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {previous.length}
            </p>
            <p className="mt-0.5 text-sm text-stone-600">Previous reservations</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Guest information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                Name
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {history.firstName} {history.lastName}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                Email
              </dt>
              <dd className="mt-1 text-sm text-stone-700">{history.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                Phone
              </dt>
              <dd className="mt-1 text-sm text-stone-700">{history.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                Country
              </dt>
              <dd className="mt-1 text-sm text-stone-700">{history.country ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                Document
              </dt>
              <dd className="mt-1 text-sm text-stone-700">
                {history.documentType ? `${history.documentType}${history.documentNumber ? ` · ${history.documentNumber}` : ""}` : "—"}
              </dd>
            </div>
          </dl>
          {history.specialNotes ? (
            <div className="mt-5 rounded-md bg-stone-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                Special notes
              </p>
              <p className="mt-1 text-sm text-stone-700">{history.specialNotes}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <GuestHistory upcoming={upcoming} previous={previous} currency={hotel.currency} />
    </div>
  );
}
