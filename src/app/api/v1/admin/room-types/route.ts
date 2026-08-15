import type { NextRequest } from "next/server";

import { handleError, ok, created } from "@/lib/api/response";
import { buildPaginationMeta } from "@/lib/api/pagination";
import { parseJsonBody } from "@/lib/api/request";
import { requirePermission } from "@/lib/permissions";
import { adminRoomTypeListSchema, parseListQuery } from "@/lib/validation/admin";
import { createRoomTypeSchema } from "@/lib/validation/room-type";
import { roomTypeRepository } from "@/server/repositories/room-type.repository";
import { roomTypeService } from "@/server/services/room-type.service";
import { hotelService } from "@/server/services/hotel.service";

/** GET — searchable/filterable/paginated room type list */
export async function GET(request: NextRequest) {
  try {
    await requirePermission("roomTypes.read");
    const hotel = await hotelService.getDefaultHotel();

    const query = parseListQuery(
      adminRoomTypeListSchema,
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const orderByMap: Record<string, object> = {
      name: { name: query.sortOrder },
      basePrice: { basePrice: query.sortOrder },
      updatedAt: { updatedAt: query.sortOrder },
    };

    const { items, total } = await roomTypeRepository.list({
      hotelId: hotel.id,
      search: query.search,
      status: query.status,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: (query.sortBy && orderByMap[query.sortBy]) || { basePrice: "asc" as const },
    });

    return ok(items, buildPaginationMeta(query.page, query.pageSize, total));
  } catch (error) {
    return handleError(error);
  }
}

/** POST — create a room type (with optional amenities). */
export async function POST(request: NextRequest) {
  try {
    await requirePermission("roomTypes.create");
    const hotel = await hotelService.getDefaultHotel();
    const body = await parseJsonBody(request);
    const parsed = createRoomTypeSchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }
    const roomType = await roomTypeService.create(parsed.data, hotel.id);
    return created(roomType);
  } catch (error) {
    return handleError(error);
  }
}
