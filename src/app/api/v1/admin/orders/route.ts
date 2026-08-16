import type { NextRequest } from "next/server";

import { handleError, ok } from "@/lib/api/response";
import { buildPaginationMeta, parsePaginationQuery } from "@/lib/api/pagination";
import { requirePermission } from "@/lib/permissions";
import { adminOrderListSchema, parseListQuery } from "@/lib/validation/admin";
import { hotelDateToUtc } from "@/lib/dates";
import { orderService } from "@/server/services/order.service";
import { hotelService } from "@/server/services/hotel.service";
import type { OrderStatus } from "@/generated/prisma/client";

/**
 * GET /api/v1/admin/orders — searchable/filterable/paginated order list
 * (orders.read).
 */
export async function GET(request: NextRequest) {
  try {
    await requirePermission("orders.read");
    const hotel = await hotelService.getDefaultHotel();

    const query = parseListQuery(
      adminOrderListSchema,
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const { skip, take, sortOrder } = parsePaginationQuery({
      page: String(query.page),
      pageSize: String(query.pageSize),
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    const orderByMap: Record<string, object> = {
      createdAt: { createdAt: sortOrder },
      status: { status: sortOrder },
      total: { total: sortOrder },
      guestName: { guestName: sortOrder },
    };

    // dateTo is inclusive: cover the whole day.
    const dateTo = query.dateTo ? hotelDateToUtc(query.dateTo) : undefined;

    const { items, total } = await orderService.listOrders({
      hotelId: hotel.id,
      search: query.search,
      status: query.status as OrderStatus | undefined,
      dateFrom: query.dateFrom ? hotelDateToUtc(query.dateFrom)! : undefined,
      dateTo: dateTo ? new Date(dateTo.getTime() + 86_400_000 - 1) : undefined,
      skip,
      take,
      orderBy:
        (query.sortBy && orderByMap[query.sortBy]) || { createdAt: "desc" as const },
    });

    return ok(items, buildPaginationMeta(query.page, query.pageSize, total));
  } catch (error) {
    return handleError(error);
  }
}
