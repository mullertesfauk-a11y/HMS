import type { NextRequest } from "next/server";

import { buildPaginationMeta, parsePaginationQuery } from "@/lib/api/pagination";
import { handleError, ok, created } from "@/lib/api/response";
import { getClientIp, parseJsonBody } from "@/lib/api/request";
import { hotelDateToUtc } from "@/lib/dates";
import { requirePermission } from "@/lib/permissions";
import { ReservationStatus } from "@/generated/prisma/client";
import { adminReservationListSchema, parseListQuery } from "@/lib/validation/admin";
import { createReservationSchema } from "@/lib/validation/reservation";
import { reservationRepository } from "@/server/repositories/reservation.repository";
import { reservationService } from "@/server/services/reservation.service";
import { hotelService } from "@/server/services/hotel.service";

/**
 * GET  /api/v1/admin/reservations — searchable/filterable/paginated list
 * POST /api/v1/admin/reservations — create on behalf of a guest
 */
export async function GET(request: NextRequest) {
  try {
    await requirePermission("reservations.read");
    const hotel = await hotelService.getDefaultHotel();

    const query = parseListQuery(
      adminReservationListSchema,
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const { skip, take, sortOrder } = parsePaginationQuery({
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

    const { items, total } = await reservationRepository.list({
      hotelId: hotel.id,
      search: query.search,
      status: query.status as ReservationStatus | undefined,
      paymentStatus: query.paymentStatus,
      roomTypeId: query.roomTypeId,
      checkInFrom: query.checkInFrom ? hotelDateToUtc(query.checkInFrom)! : undefined,
      checkInTo: query.checkInTo ? hotelDateToUtc(query.checkInTo)! : undefined,
      skip,
      take,
      orderBy: (query.sortBy && orderByMap[query.sortBy]) || { createdAt: "desc" as const },
    });

    return ok(items, buildPaginationMeta(query.page, query.pageSize, total));
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requirePermission("reservations.create");
    const body = await parseJsonBody(request);
    const parsed = createReservationSchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }

    // Admin API parity with the UI: `checkInNow` skips pre-arrival statuses
    // (walk-in bookings start CHECKED_IN). Never trusted from the public API.
    const checkInNow =
      typeof body === "object" &&
      body !== null &&
      "checkInNow" in body &&
      body.checkInNow === true;

    const hotel = await hotelService.getDefaultHotel();
    const reservation = await reservationService.createReservation(parsed.data, {
      hotelId: hotel.id,
      currency: hotel.currency,
      taxRate: hotel.taxRate.toNumber(),
      createdById: actor.id,
      checkInNow,
      ipAddress: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });

    return created(reservation);
  } catch (error) {
    return handleError(error);
  }
}
