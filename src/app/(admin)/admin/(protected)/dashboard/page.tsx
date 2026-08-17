import Link from "next/link";
import {
  ArrowUpRight,
  Bed,
  CalendarCheck,
  CalendarX,
  CheckCircle2,
  Clock,
  DoorOpen,
  Wallet,
} from "lucide-react";

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

  const kpis = [
    {
      label: "Today's Arrivals",
      value: String(metrics.arrivalsToday),
      href: "/admin/reservations?arrival=today",
      icon: CalendarCheck,
      hint: "Stays starting today",
      accent: "text-emerald-700 bg-emerald-50 border-emerald-200/70",
    },
    {
      label: "Today's Departures",
      value: String(metrics.departuresToday),
      href: "/admin/reservations?departure=today",
      icon: CalendarX,
      hint: "Stays ending today",
      accent: "text-sky-700 bg-sky-50 border-sky-200/70",
    },
    {
      label: "Occupancy Rate",
      value: `${metrics.occupancy.percentage}%`,
      href: "/admin/rooms?status=OCCUPIED",
      icon: DoorOpen,
      hint: `${metrics.occupancy.occupied} of ${metrics.occupancy.total} rooms occupied`,
      accent: "text-[#004fff] bg-blue-50 border-blue-200/70",
    },
    {
      label: "Available Rooms",
      value: String(metrics.availableRooms),
      href: "/admin/rooms?status=AVAILABLE",
      icon: Bed,
      hint: "Ready for guest check-in",
      accent: "text-indigo-700 bg-indigo-50 border-indigo-200/70",
    },
    {
      label: "Pending Booking",
      value: String(metrics.pendingReservations),
      href: "/admin/reservations?status=PENDING",
      icon: Clock,
      hint: "Awaiting front desk action",
      accent: "text-amber-700 bg-amber-50 border-amber-200/70",
    },
    {
      label: "Confirmed Stays",
      value: String(metrics.confirmedReservations),
      href: "/admin/reservations?status=CONFIRMED",
      icon: CheckCircle2,
      hint: "Guaranteed upcoming stays",
      accent: "text-emerald-700 bg-emerald-50 border-emerald-200/70",
    },
    {
      label: "In-House Revenue",
      value: formatMoney(metrics.revenueToday.amount, metrics.revenueToday.currency),
      href: "/admin/reservations?status=CHECKED_IN",
      icon: Wallet,
      hint: "Active in-house booking value",
      accent: "text-brand-dark bg-brand-light border-brand/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            Property Overview
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Operations summary for <span className="font-medium text-slate-800">{formatDateFriendly(today)}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/reservations"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-surface-subtle hover:text-slate-900 transition-colors"
          >
            Manage Reservations
          </Link>
          <Link
            href="/admin/rooms"
            className="inline-flex items-center gap-2 rounded-md bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-brand-dark transition-all"
          >
            Room Status
            <ArrowUpRight className="h-3.5 w-3.5 opacity-80" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <section aria-labelledby="kpi-heading" className="space-y-3">
        <h2 id="kpi-heading" className="sr-only">Key Performance Indicators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Link
                key={kpi.label}
                href={kpi.href}
                className="group relative flex flex-col justify-between rounded-lg border border-border bg-white p-4.5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700 transition-colors">
                    {kpi.label}
                  </span>
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-xs ${kpi.accent}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-2xl font-bold tracking-tight text-foreground">
                    {kpi.value}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500 font-medium truncate">
                    {kpi.hint}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Today's Arrivals Section */}
      <section className="space-y-3.5" aria-labelledby="arrivals-heading">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="arrivals-heading" className="text-base font-semibold text-foreground">
              Today&apos;s Arrivals
            </h2>
            <p className="text-xs text-slate-500">Guests scheduled to check in today.</p>
          </div>
          <Link
            href="/admin/reservations?arrival=today"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#004fff] hover:underline transition-colors"
          >
            <span>View all arrivals</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
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

      {/* Upcoming Reservations Section */}
      <section className="space-y-3.5" aria-labelledby="upcoming-heading">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="upcoming-heading" className="text-base font-semibold text-foreground">
              Upcoming Reservations
            </h2>
            <p className="text-xs text-slate-500">Pending and confirmed stays from today onward.</p>
          </div>
          <Link
            href="/admin/reservations"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#004fff] hover:underline transition-colors"
          >
            <span>All reservations</span>
            <ArrowUpRight className="h-3 w-3" />
          </Link>
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

