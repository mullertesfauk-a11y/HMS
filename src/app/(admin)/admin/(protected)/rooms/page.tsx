
import type { TableSort } from "@/components/admin/data-table";
import { RoomsTable } from "@/components/admin/rooms/rooms-table";
import { RoomsToolbar, type RoomsFilterOptions } from "@/components/admin/rooms/rooms-toolbar";
import { requirePermissionPage } from "@/lib/permissions";
import { RoomStatus } from "@/generated/prisma/client";
import { adminRoomListSchema, parseListQuery } from "@/lib/validation/admin";
import { roomService } from "@/server/services/room.service";
import { roomTypeRepository } from "@/server/repositories/room-type.repository";
import { hotelService } from "@/server/services/hotel.service";

function formatDateOnly(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermissionPage("rooms.read");
  const hotel = await hotelService.getDefaultHotel();
  const roomTypes = await roomTypeRepository.listActive(hotel.id);
  const rawParams = await searchParams;

  let query: ReturnType<typeof parseListQuery<typeof adminRoomListSchema>>;
  try {
    query = parseListQuery(adminRoomListSchema, rawParams);
  } catch {
    query = parseListQuery(adminRoomListSchema, {});
  }

  const page = query.page;
  const pageSize = query.pageSize;
  const sortOrder = query.sortOrder;
  const sort: TableSort | null = query.sortBy ? { id: query.sortBy, desc: sortOrder === "desc" } : null;

  const { items, total } = await roomService.list({
    hotelId: hotel.id,
    search: query.search,
    roomTypeId: query.roomTypeId,
    floor: query.floor,
    status: query.status as RoomStatus | undefined,
    page,
    pageSize,
    sortBy: query.sortBy,
    sortOrder,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const filterOptions: RoomsFilterOptions = {
    statuses: Object.values(RoomStatus),
    roomTypes: roomTypes.map((roomType) => ({ id: roomType.id, name: roomType.name })),
    floors: [...new Set(items.map((item) => item.floor).filter((floor): floor is number => floor !== null))].sort(
      (a, b) => a - b,
    ),
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Rooms</h1>
        <p className="mt-0.5 text-sm text-stone-500">
          Physical rooms, housekeeping status, and upcoming occupancy.
        </p>
      </div>

      <RoomsToolbar options={filterOptions} />

      <RoomsTable
        rooms={items.map((room) => {
          const reservation = room.reservationRooms[0]?.reservation ?? null;
          return {
            id: room.id,
            roomNumber: room.roomNumber,
            roomTypeName: room.roomType.name,
            floor: room.floor,
            status: room.status,
            reservation: reservation
              ? {
                  id: reservation.id,
                  reservationNumber: reservation.reservationNumber,
                  checkIn: formatDateOnly(reservation.checkIn),
                  checkOut: formatDateOnly(reservation.checkOut),
                  guest: reservation.guest,
                }
              : null,
            updatedAt: room.updatedAt.toISOString(),
          };
        })}
        sort={sort}
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
      />
    </div>
  );
}
