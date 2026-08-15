import type { NextRequest } from "next/server";

import { handleError, ok, created } from "@/lib/api/response";
import { buildPaginationMeta, parsePaginationQuery } from "@/lib/api/pagination";
import { parseJsonBody } from "@/lib/api/request";
import { requirePermission } from "@/lib/permissions";
import { adminRoomListSchema, parseListQuery } from "@/lib/validation/admin";
import { createRoomSchema } from "@/lib/validation/room";
import { roomService } from "@/server/services/room.service";
import { hotelService } from "@/server/services/hotel.service";
import type { RoomStatus } from "@/generated/prisma/client";

/** GET  /api/v1/admin/rooms — searchable/filterable/paginated list */
export async function GET(request: NextRequest) {
  try {
    await requirePermission("rooms.read");
    const hotel = await hotelService.getDefaultHotel();

    const query = parseListQuery(
      adminRoomListSchema,
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const { skip, take, sortOrder } = parsePaginationQuery({
      page: String(query.page),
      pageSize: String(query.pageSize),
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    const orderByMap: Record<string, object> = {
      roomNumber: { roomNumber: sortOrder },
      floor: { floor: sortOrder },
      updatedAt: { updatedAt: sortOrder },
    };

    const { items, total } = await roomService.list({
      hotelId: hotel.id,
      search: query.search,
      roomTypeId: query.roomTypeId,
      floor: query.floor,
      status: query.status as RoomStatus | undefined,
      page: query.page,
      pageSize: query.pageSize,
      sortBy: query.sortBy && orderByMap[query.sortBy] ? query.sortBy : undefined,
      sortOrder,
    });
    void skip;
    void take;

    return ok(items, buildPaginationMeta(query.page, query.pageSize, total));
  } catch (error) {
    return handleError(error);
  }
}

/** POST — create a room. */
export async function POST(request: NextRequest) {
  try {
    await requirePermission("rooms.create");
    const hotel = await hotelService.getDefaultHotel();
    const body = await parseJsonBody(request);
    const parsed = createRoomSchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }
    const room = await roomService.create(parsed.data, hotel.id);
    return created(room);
  } catch (error) {
    return handleError(error);
  }
}
