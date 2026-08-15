import Link from "next/link";

import type { TableSort } from "@/components/admin/data-table";
import { RoomTypesTable } from "@/components/admin/room-types/room-types-table";
import {
  RoomTypesToolbar,
  type RoomTypesFilterOptions,
} from "@/components/admin/room-types/room-types-toolbar";
import { requirePermissionPage } from "@/lib/permissions";
import { RoomTypeStatus } from "@/generated/prisma/client";
import { adminRoomTypeListSchema, parseListQuery } from "@/lib/validation/admin";
import { roomTypeService } from "@/server/services/room-type.service";
import { hotelService } from "@/server/services/hotel.service";

export default async function RoomTypesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermissionPage("roomTypes.read");
  const hotel = await hotelService.getDefaultHotel();
  const rawParams = await searchParams;

  let query: ReturnType<typeof parseListQuery<typeof adminRoomTypeListSchema>>;
  try {
    query = parseListQuery(adminRoomTypeListSchema, rawParams);
  } catch {
    query = parseListQuery(adminRoomTypeListSchema, {});
  }

  const page = query.page;
  const pageSize = query.pageSize;
  const sortOrder = query.sortOrder;

  const { items, total } = await roomTypeService.list({
    hotelId: hotel.id,
    search: query.search,
    status: query.status,
    page,
    pageSize,
    sortBy: query.sortBy,
    sortOrder,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const sort: TableSort | null = query.sortBy
    ? { id: query.sortBy, desc: sortOrder === "desc" }
    : null;
  const filterOptions: RoomTypesFilterOptions = {
    statuses: Object.values(RoomTypeStatus),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Room types</h1>
          <p className="mt-0.5 text-sm text-stone-500">
            Categories guests book — not individual rooms.
          </p>
        </div>
        <Link
          href="/admin/room-types/new"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          New room type
        </Link>
      </div>

      <RoomTypesToolbar options={filterOptions} />

      <RoomTypesTable
        roomTypes={items.map((roomType) => ({
          id: roomType.id,
          name: roomType.name,
          bedType: roomType.bedType,
          capacity: roomType.capacity,
          basePrice: roomType.basePrice.toNumber(),
          rooms: roomType._count.rooms,
          status: roomType.status,
          updatedAt: roomType.updatedAt.toISOString(),
        }))}
        currency={hotel.currency}
        sort={sort}
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
      />
    </div>
  );
}
