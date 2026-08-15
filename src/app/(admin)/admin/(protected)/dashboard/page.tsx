import Link from "next/link";
import { CalendarCheck, CalendarX, DoorOpen, TrendingUp, Wallet } from "lucide-react";

import { ReservationsTable } from "@/components/admin/reservations/reservations-table";
import { toAdminReservationRow } from "@/server/services/reservation.admin-view";
import { dashboardService } from "@/server/services/dashboard.service";
import { requirePermissionPage } from "@/lib/permissions";
import { ReservationStatus } from "@/generated/prisma/client";
import { reservationRepository } from "@/server/repositories/reservation.repository";
import { hotelService } from "@/server/services/hotel.service";
import { formatMoney } from "@/lib/utils/display";

/** Today's date in the hotel's timezone, as YYYY-MM-DD. */
function todayInTimezone(timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default async function DashboardPage() {
  await requirePermissionPage("dashboard.view");
  const hotel = await hotelService.getDefaultHotel();
  const metrics = await dashboardService.getMetrics(hotel.id, new Date(), hotel.currency);
  const today = todayInTimezone(hotel.timezone);

  const todayStart = new Date(`${today}T00:00:00Z`);
  const todayEnd = new Date(`${today}T23:59:59.999Z`);

  const [arrivals, upcoming] = await Promise.all([
    reservationRepository.list({
      hotelId: hotel.id,
      checkInFrom: todayStart,
      checkInTo: todayEnd,
      status: undefined,
      skip: 0,
      take: 10,
      orderBy: { checkIn: "asc" },
    }),
    reservationRepository.list({
      hotelId: hotel.id,
      status: undefined,
      checkInFrom: todayStart,
      skip: 0,
      take: 10,
      orderBy: { checkIn: "asc" },
    }),
  ]);

  const EXCLUDED_ARRIVALS: ReservationStatus[] = [
    ReservationStatus.CANCELLED,
    ReservationStatus.NO_SHOW,
    ReservationStatus.CHECKED_OUT,
  ];
  const arrivalsRows = arrivals.items
    .filter((item) => !EXCLUDED_ARRIVALS.includes(item.status))
    .map(toAdminReservationRow);

  const upcomingRows = upcoming.items
    .filter((item) => item.status === ReservationStatus.PENDING || item.status === ReservationStatus.CONFIRMED)
    .map(toAdminReservationRow);

  const tiles = [
    {
      label: "Today's arrivals",
      value: String(metrics.arrivalsToday),
      href: "/admin/reservations?arrival=today",
      icon: CalendarCheck,
      hint: "Stays starting today",
    },
    {
      label: "Today's departures",
      value: String(metrics.departuresToday),
      href: "/admin/reservations?departure=today",
      icon: CalendarX,
      hint: "Stays ending today",
    },
    {
      label: "Occupancy",
      value: `${metrics.occupancy.percentage}%`,
      href: "/admin/rooms?status=OCCUPIED",
      icon: DoorOpen,
      hint: `${metrics.occupancy.occupied} of ${metrics.occupancy.total} rooms`,
    },
    {
      label: "Available rooms",
      value: String(metrics.availableRooms),
      href: "/admin/rooms?status=AVAILABLE",
      icon: DoorOpen,
      hint: "Housekeeping status",
    },
    {
      label: "Pending",
      value: String(metrics.pendingReservations),
      href: "/admin/reservations?status=PENDING",
      icon: Wallet,
      hint: "Awaiting confirmation",
    },
    {
      label: "Confirmed",
      value: String(metrics.confirmedReservations),
      href: "/admin/reservations?status=CONFIRMED",
      icon: TrendingUp,
      hint: "Guaranteed stays",
    },
    {
      label: "Revenue in house",
      value: formatMoney(metrics.revenueToday.amount, metrics.revenueToday.currency),
      href: "/admin/reservations?status=CHECKED_IN",
      icon: Wallet,
      hint: "Booking value of in-house guests",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-0.5 text-sm text-stone-500">
          Operational overview for {formatDateFriendly(today)}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <Link
            key={tile.label}
            href={tile.href}
            className="rounded-lg border border-stone-200 bg-white p-4 transition-colors hover:border-brand/40 hover:bg-brand-light/30"
          >
            <Icon aria-hidden className="h-4 w-4 text-stone-400" />
            <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
              {tile.value}
            </p>
            <p className="mt-0.5 text-sm font-medium text-stone-700">{tile.label}</p>
            <p className="mt-0.5 text-xs text-stone-500">{tile.hint}</p>
          </Link>
        );
      })}
      </div>

      <section className="space-y-3" aria-labelledby="arrivals-heading">
        <div>
          <h2 id="arrivals-heading" className="text-base font-semibold text-foreground">
            Today&apos;s arrivals
          </h2>
          <p className="text-sm text-stone-500">Guests checking in today.</p>
        </div>
        <ReservationsTable
          rows={arrivalsRows}
          currency={hotel.currency}
          sort={null}
          page={1}
          pageSize={10}
          total={arrivalsRows.length}
          totalPages={Math.max(1, Math.ceil(arrivalsRows.length / 10))}
        />
      </section>

      <section className="space-y-3" aria-labelledby="upcoming-heading">
        <div>
          <h2 id="upcoming-heading" className="text-base font-semibold text-foreground">
            Upcoming reservations
          </h2>
          <p className="text-sm text-stone-500">Pending and confirmed stays from today onward.</p>
        </div>
        <ReservationsTable
          rows={upcomingRows}
          currency={hotel.currency}
          sort={{ id: "checkIn", desc: false }}
          page={1}
          pageSize={10}
          total={upcomingRows.length}
          totalPages={Math.max(1, Math.ceil(upcomingRows.length / 10))}
        />
      </section>
    </div>
  );
}

function formatDateFriendly(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}
