import { Suspense } from "react";

import { TableSkeleton } from "@/components/admin/table-skeleton";
import {
  ReservationToolbar,
  type ReservationFilterOptions,
} from "@/components/admin/reservations/reservation-toolbar";
import { ReservationsTable } from "@/components/admin/reservations/reservations-table";
import type { ReservationRow } from "@/components/admin/reservations/reservation-columns";
import type { TableSort } from "@/components/admin/data-table";
import { buildPaginationMeta, parsePaginationQuery } from "@/lib/api/pagination";
import { requirePermissionPage } from "@/lib/permissions";
import { PaymentStatus, ReservationStatus } from "@/generated/prisma/client";
import { adminReservationListSchema, parseListQuery } from "@/lib/validation/admin";
import { hotelDateToUtc } from "@/lib/dates";
import { reservationRepository } from "@/server/repositories/reservation.repository";
import { roomTypeRepository } from "@/server/repositories/room-type.repository";
import { hotelService } from "@/server/services/hotel.service";

/** Today's date in the hotel's timezone, as YYYY-MM-DD. */
function todayInTimezone(timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default async function ReservationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermissionPage("reservations.read");
  const hotel = await hotelService.getDefaultHotel();
  const roomTypes = await roomTypeRepository.listActive(hotel.id);
  const rawParams = await searchParams;

  // Dashboard shortcuts: /admin/reservations?arrival=today / ?departure=today
  const arrival = rawParams["arrival"]?.[0] ?? rawParams["arrival"];
  const departure = rawParams["departure"]?.[0] ?? rawParams["departure"];
  const today = todayInTimezone(hotel.timezone);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(rawParams)) {
    if (key === "arrival" || key === "departure") continue;
    params.set(key, Array.isArray(value) ? value[0] : (value ?? ""));
  }
  if (arrival === "today") {
    params.set("checkInFrom", today);
    params.set("checkInTo", today);
  }
  if (departure === "today") {
    params.set("checkOutFrom", today);
    params.set("checkOutTo", today);
  }

  let query: ReturnType<typeof parseListQuery<typeof adminReservationListSchema>>;
  try {
    query = parseListQuery(adminReservationListSchema, Object.fromEntries(params));
  } catch {
    query = parseListQuery(adminReservationListSchema, {});
  }

  const { page, pageSize, skip, take, sortOrder } = parsePaginationQuery({
    page: String(query.page),
    pageSize: String(query.pageSize),
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  const orderByMap: Record<string, object> = {
    checkIn: { checkIn: sortOrder },
    checkOut: { checkOut: sortOrder },
    createdAt: { createdAt: sortOrder },
    status: { status: sortOrder },
    total: { total: sortOrder },
  };
  const sort: TableSort | null = query.sortBy
    ? { id: query.sortBy, desc: sortOrder === "desc" }
    : null;
  // Default: most recent first.
  const effectiveOrderBy =
    (query.sortBy && orderByMap[query.sortBy]) || { createdAt: "desc" as const };

  const { items, total } = await reservationRepository.list({
    hotelId: hotel.id,
    search: query.search,
    status: query.status as ReservationStatus | undefined,
    paymentStatus: query.paymentStatus,
    roomTypeId: query.roomTypeId,
    checkInFrom: query.checkInFrom ? hotelDateToUtc(query.checkInFrom)! : undefined,
    checkInTo: query.checkInTo ? hotelDateToUtc(query.checkInTo)! : undefined,
    checkOutFrom: query.checkOutFrom ? hotelDateToUtc(query.checkOutFrom)! : undefined,
    checkOutTo: query.checkOutTo ? hotelDateToUtc(query.checkOutTo)! : undefined,
    skip,
    take,
    orderBy: effectiveOrderBy,
  });

  const rows: ReservationRow[] = items.map((item) => {
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
  });

  const meta = buildPaginationMeta(page, pageSize, total);
  const filterOptions: ReservationFilterOptions = {
    statuses: Object.values(ReservationStatus),
    paymentStatuses: Object.values(PaymentStatus),
    roomTypes: roomTypes.map((roomType) => ({ id: roomType.id, name: roomType.name })),
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Reservations</h1>
        <p className="mt-0.5 text-sm text-stone-500">
          Search, filter, and manage every stay.
        </p>
      </div>

      <ReservationToolbar options={filterOptions} newReservationHref="/admin/reservations/new" />

      <Suspense fallback={<TableSkeleton rows={10} columns={10} />}>
        <ReservationsTable
          rows={rows}
          currency={hotel.currency}
          sort={sort}
          page={meta.page}
          pageSize={meta.pageSize}
          total={meta.total}
          totalPages={meta.totalPages}
        />
      </Suspense>
    </div>
  );
}

function formatDateOnly(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
