import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  BedDouble,
  CalendarDays,
  CreditCard,
  DoorOpen,
  Moon,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { ReservationActions, RoomAssignment } from "@/components/admin/reservations/reservation-actions";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requirePermissionPage } from "@/lib/permissions";
import { PaymentStatus } from "@/generated/prisma/client";
import { reservationRepository } from "@/server/repositories/reservation.repository";
import { availabilityService } from "@/server/services/availability.service";
import { hotelService } from "@/server/services/hotel.service";
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

const ACTION_DOT: Record<string, string> = {
  "reservation.created": "bg-brand",
  "reservation.confirmed": "bg-sky-500",
  "reservation.checked_in": "bg-emerald-500",
  "reservation.checked_out": "bg-slate-400",
  "reservation.no_show": "bg-violet-500",
  "reservation.cancelled": "bg-red-500",
  "reservation.room_assigned": "bg-brand-brass",
  "reservation.updated": "bg-slate-400",
};

function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

function OverviewStat({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex min-w-[150px] flex-1 flex-col gap-1 border-l border-border-subtle px-5 py-4 first:border-l-0">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        <Icon aria-hidden className="h-3 w-3" />
        {label}
      </div>
      <p className="truncate text-sm font-semibold text-foreground">{value}</p>
      {sub ? <p className="truncate text-xs text-slate-500">{sub}</p> : null}
    </div>
  );
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

  const hotel = await hotelService.getDefaultHotel();
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

  const createdLog = reservation.auditLogs.find((log) => log.action === "reservation.created");
  const bookedBy = createdLog?.user?.name ?? (createdLog?.userId ? "Staff" : "Online");

  const canAssignRoom =
    (reservation.status === "PENDING" || reservation.status === "CONFIRMED") &&
    Boolean(roomLine);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/admin/reservations"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
        Reservations
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
              Reservation{" "}
              <span className="font-mono text-lg font-semibold text-slate-700">
                {reservation.reservationNumber}
              </span>
            </h1>
            <StatusBadge value={reservation.status} />
            <StatusBadge value={primaryPayment?.status ?? PaymentStatus.PENDING} />
          </div>
          <p className="mt-1.5 text-sm text-slate-500">
            {guest.firstName} {guest.lastName}
            {guest.email ? ` · ${guest.email}` : ""}
            <span className="text-slate-300"> · </span>
            Booked {formatDateTime(reservation.createdAt)} by {bookedBy}
          </p>
        </div>

        <ReservationActions reservationId={reservation.id} status={reservation.status} />
      </div>

      {/* Stay overview strip */}
      <Card>
        <div className="flex flex-wrap">
          <OverviewStat
            icon={CalendarDays}
            label="Check-in"
            value={formatDateFriendly(reservation.checkIn)}
            sub={`from ${hotel.checkInTime}`}
          />
          <OverviewStat
            icon={CalendarDays}
            label="Check-out"
            value={formatDateFriendly(reservation.checkOut)}
            sub={`by ${hotel.checkOutTime}`}
          />
          <OverviewStat
            icon={Moon}
            label="Duration"
            value={`${nights} night${nights === 1 ? "" : "s"}`}
            sub="Length of stay"
          />
          <OverviewStat
            icon={Users}
            label="Guests"
            value={`${reservation.adults} adult${reservation.adults === 1 ? "" : "s"}`}
            sub={
              reservation.children > 0
                ? `${reservation.children} child${reservation.children === 1 ? "" : "ren"}`
                : "No children"
            }
          />
          <OverviewStat
            icon={BedDouble}
            label="Room type"
            value={roomLine?.roomType.name ?? "—"}
            sub={roomLine?.roomType.bedType ?? undefined}
          />
          <OverviewStat
            icon={DoorOpen}
            label="Room"
            value={roomLine?.room ? `Room ${roomLine.room.roomNumber}` : "Not assigned"}
            sub={roomLine?.room?.floor ? `Floor ${roomLine.room.floor}` : undefined}
          />
          <OverviewStat
            icon={Wallet}
            label="Total"
            value={formatMoney(reservation.total, reservation.currency)}
            sub={reservation.currency}
          />
        </div>
      </Card>

      {/* Main grid */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* ── Left column ─────────────────────────────────────────── */}
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays aria-hidden className="h-4 w-4 text-slate-400" />
                Stay
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Check-in
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {formatDateFriendly(reservation.checkIn)}
                  </dd>
                  <dd className="text-xs text-slate-400">from {hotel.checkInTime}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Check-out
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {formatDateFriendly(reservation.checkOut)}
                  </dd>
                  <dd className="text-xs text-slate-400">by {hotel.checkOutTime}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Duration
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {nights} night{nights === 1 ? "" : "s"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Guests
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {reservation.adults} adult{reservation.adults === 1 ? "" : "s"}
                    {reservation.children > 0
                      ? ` · ${reservation.children} child${reservation.children === 1 ? "" : "ren"}`
                      : ""}
                  </dd>
                </div>
              </dl>

              {reservation.specialRequests ? (
                <div className="mt-5 rounded-md bg-surface-subtle px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Special requests
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{reservation.specialRequests}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BedDouble aria-hidden className="h-4 w-4 text-slate-400" />
                Room
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {roomLine?.roomType.name ?? "—"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {roomLine?.roomType.bedType}
                    {roomLine?.roomType.size ? ` · ${roomLine.roomType.size} m²` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">
                    {roomLine?.room ? (
                      <>
                        Room {roomLine.room.roomNumber}
                        {roomLine.room.floor ? (
                          <span className="ml-1 text-xs font-normal text-slate-400">
                            · Floor {roomLine.room.floor}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-sm font-medium italic text-slate-400">
                        Not assigned
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {canAssignRoom ? (
                <div className="mt-4 border-t border-border-subtle pt-4">
                  <RoomAssignment
                    reservationId={reservation.id}
                    roomTypeId={roomLine?.roomTypeId ?? null}
                    canAssign
                    assignableRooms={freeRooms}
                    assignedRoomId={roomLine?.roomId ?? null}
                  />
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet aria-hidden className="h-4 w-4 text-slate-400" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent>
              {roomLine ? (
                <div className="mb-4 flex items-center justify-between rounded-md bg-surface-subtle px-4 py-3 text-sm">
                  <span className="text-slate-600">
                    {roomLine.roomType.name} · {formatMoney(roomLine.pricePerNight, reservation.currency)} / night × {roomLine.numberOfNights}
                  </span>
                  <span className="font-medium text-foreground">
                    {formatMoney(roomLine.subtotal, reservation.currency)}
                  </span>
                </div>
              ) : null}
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Subtotal</dt>
                  <dd className="font-medium text-foreground">
                    {formatMoney(reservation.subtotal, reservation.currency)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Tax</dt>
                  <dd className="font-medium text-foreground">
                    {formatMoney(reservation.tax, reservation.currency)}
                  </dd>
                </div>
                {reservation.discount.toNumber() > 0 ? (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Discount</dt>
                    <dd className="font-medium text-emerald-700">
                      −{formatMoney(reservation.discount, reservation.currency)}
                    </dd>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-border-subtle pt-2.5 text-base">
                  <dt className="font-semibold text-foreground">Total</dt>
                  <dd className="font-display text-lg font-bold text-foreground">
                    {formatMoney(reservation.total, reservation.currency)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard aria-hidden className="h-4 w-4 text-slate-400" />
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
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatMoney(primaryPayment.amount, primaryPayment.currency)}
                      {primaryPayment.transactionReference
                        ? ` · Ref ${primaryPayment.transactionReference}`
                        : ""}
                    </p>
                  </div>
                  <StatusBadge value={primaryPayment.status} />
                </div>
              ) : (
                <p className="text-sm text-slate-500">No payment recorded.</p>
              )}
              {primaryPayment?.status === PaymentStatus.PENDING ? (
                <p className="mt-3 rounded-md bg-surface-subtle px-3 py-2 text-xs text-slate-500">
                  Payment is pending — collect it at check-in.
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        {/* ── Right column ─────────────────────────────────────────── */}
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound aria-hidden className="h-4 w-4 text-slate-400" />
                Guest
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-light text-sm font-bold text-brand-dark">
                  {initials(guest.firstName, guest.lastName)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {guest.firstName} {guest.lastName}
                  </p>
                  <p className="truncate text-xs text-slate-500">{guest.email ?? "No email"}</p>
                </div>
              </div>

              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Phone</dt>
                  <dd className="font-medium text-foreground">{guest.phone ?? "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Country</dt>
                  <dd className="font-medium text-foreground">{guest.country ?? "—"}</dd>
                </div>
              </dl>

              <Link
                href={`/admin/guests/${guest.id}`}
                className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-dark transition-colors"
              >
                View guest profile
                <ArrowUpRight aria-hidden className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays aria-hidden className="h-4 w-4 text-slate-400" />
                Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reservation.auditLogs.length === 0 ? (
                <p className="text-sm text-slate-500">No activity recorded yet.</p>
              ) : (
                <ol className="relative space-y-5 border-l border-slate-200 pl-5">
                  {reservation.auditLogs.map((log) => (
                    <li key={log.id} className="relative">
                      <span
                        aria-hidden
                        className={`absolute -left-[25.5px] top-1 h-3 w-3 rounded-full border-2 border-white shadow-sm ${ACTION_DOT[log.action] ?? "bg-slate-400"}`}
                      />
                      <p className="text-sm font-medium text-foreground">
                        {actionLabel(log.action)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatDateTime(log.createdAt)}
                        {log.user
                          ? ` · ${log.user.name}`
                          : log.userId
                            ? " · Staff"
                            : " · Guest"}
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
