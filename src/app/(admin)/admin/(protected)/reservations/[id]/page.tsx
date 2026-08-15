import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BedDouble, CalendarDays, CreditCard, UserRound } from "lucide-react";

import { ReservationActions } from "@/components/admin/reservations/reservation-actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermissionPage } from "@/lib/permissions";
import { PaymentStatus } from "@/generated/prisma/client";
import { reservationRepository } from "@/server/repositories/reservation.repository";
import { availabilityService } from "@/server/services/availability.service";
import { formatDateFriendly, formatDateTime, formatMoney } from "@/lib/utils/display";

function nightsBetween(checkIn: Date, checkOut: Date): number {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000);
}

function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    "reservation.created": "Reservation created",
    "reservation.confirmed": "Confirmed",
    "reservation.cancelled": "Cancelled",
    "reservation.checked_in": "Checked in",
    "reservation.checked_out": "Checked out",
    "reservation.no_show": "Marked no-show",
    "reservation.room_assigned": "Room assigned",
    "reservation.updated": "Reservation updated",
  };
  return labels[action] ?? action.replaceAll("_", " ");
}

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePermissionPage("reservations.read");
  const { id } = await params;

  const reservation = await reservationRepository.findById(id);
  if (!reservation) notFound();

  const roomLine = reservation.rooms[0];
  const freeRooms = roomLine
    ? await availabilityService.findAvailableRooms({
        hotelId: reservation.hotelId,
        roomTypeId: roomLine.roomTypeId,
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
        excludeReservationId: reservation.id,
      })
    : [];

  const nights = nightsBetween(reservation.checkIn, reservation.checkOut);
  const guest = reservation.guest;
  const primaryPayment =
    reservation.payments.find((p) => p.status !== PaymentStatus.PENDING) ??
    reservation.payments[0];

  return (
    <div className="space-y-5">
      <Link
        href="/admin/reservations"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        Back to reservations
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-lg font-semibold text-foreground">
              {reservation.reservationNumber}
            </h1>
            <StatusBadge value={reservation.status} />
          </div>
          <p className="mt-1 text-sm text-stone-500">
            {guest.firstName} {guest.lastName} · {formatMoney(reservation.total, reservation.currency)}
          </p>
        </div>

        <ReservationActions
          reservationId={reservation.id}
          status={reservation.status}
          roomTypeId={roomLine?.roomTypeId ?? null}
          assignableRooms={freeRooms}
          assignedRoomId={roomLine?.roomId ?? null}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays aria-hidden className="h-4 w-4 text-stone-400" />
                Stay
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Check-in
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {formatDateFriendly(reservation.checkIn)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Check-out
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {formatDateFriendly(reservation.checkOut)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Duration
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {nights} night{nights === 1 ? "" : "s"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Guests
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {reservation.adults} adult{reservation.adults === 1 ? "" : "s"}
                    {reservation.children > 0
                      ? ` · ${reservation.children} child${reservation.children === 1 ? "" : "ren"}`
                      : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Room type
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {roomLine?.roomType.name ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Assigned room
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {roomLine?.room ? (
                      <>
                        Room {roomLine.room.roomNumber}
                        {roomLine.room.floor ? ` · Floor ${roomLine.room.floor}` : ""}
                      </>
                    ) : (
                      <span className="italic text-stone-400">Not assigned</span>
                    )}
                  </dd>
                </div>
              </dl>

              {reservation.specialRequests ? (
                <div className="mt-5 rounded-md bg-stone-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Special requests
                  </p>
                  <p className="mt-1 text-sm text-stone-700">{reservation.specialRequests}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard aria-hidden className="h-4 w-4 text-stone-400" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent>
              {roomLine ? (
                <div className="mb-4 flex items-center justify-between rounded-md bg-stone-50 px-4 py-3 text-sm">
                  <span className="text-stone-600">
                    {roomLine.roomType.name} · {formatMoney(roomLine.pricePerNight, reservation.currency)} / night × {roomLine.numberOfNights}
                  </span>
                  <span className="font-medium text-foreground">
                    {formatMoney(roomLine.subtotal, reservation.currency)}
                  </span>
                </div>
              ) : null}
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-stone-500">Subtotal</dt>
                  <dd className="font-medium text-foreground">
                    {formatMoney(reservation.subtotal, reservation.currency)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-stone-500">Tax</dt>
                  <dd className="font-medium text-foreground">
                    {formatMoney(reservation.tax, reservation.currency)}
                  </dd>
                </div>
                {reservation.discount.toNumber() > 0 ? (
                  <div className="flex justify-between">
                    <dt className="text-stone-500">Discount</dt>
                    <dd className="font-medium text-emerald-700">
                      −{formatMoney(reservation.discount, reservation.currency)}
                    </dd>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-stone-100 pt-2 text-base">
                  <dt className="font-semibold text-foreground">Total</dt>
                  <dd className="font-semibold text-foreground">
                    {formatMoney(reservation.total, reservation.currency)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard aria-hidden className="h-4 w-4 text-stone-400" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              {primaryPayment ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {primaryPayment.method}
                    </p>
                    <p className="text-xs text-stone-500">
                      {formatMoney(primaryPayment.amount, primaryPayment.currency)}
                      {primaryPayment.transactionReference
                        ? ` · Ref ${primaryPayment.transactionReference}`
                        : ""}
                    </p>
                  </div>
                  <StatusBadge value={primaryPayment.status} />
                </div>
              ) : (
                <p className="text-sm text-stone-500">No payment recorded.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound aria-hidden className="h-4 w-4 text-stone-400" />
                Guest
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Name
                  </dt>
                  <dd className="mt-0.5 font-medium text-foreground">
                    {guest.firstName} {guest.lastName}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Email
                  </dt>
                  <dd className="mt-0.5 text-stone-700">{guest.email ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Phone
                  </dt>
                  <dd className="mt-0.5 text-stone-700">{guest.phone ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Country
                  </dt>
                  <dd className="mt-0.5 text-stone-700">{guest.country ?? "—"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BedDouble aria-hidden className="h-4 w-4 text-stone-400" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reservation.auditLogs.length === 0 ? (
                <p className="text-sm text-stone-500">No activity recorded yet.</p>
              ) : (
                <ol className="relative space-y-4 border-l border-stone-200 pl-4">
                  {reservation.auditLogs.map((log) => (
                    <li key={log.id} className="relative">
                      <span
                        aria-hidden
                        className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-brand"
                      />
                      <p className="text-sm font-medium text-foreground">
                        {actionLabel(log.action)}
                      </p>
                      <p className="text-xs text-stone-500">
                        {formatDateTime(log.createdAt)}
                        {log.user ? ` · ${log.user.name}` : log.userId ? " · Staff" : " · Guest"}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
