import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";

import { RoomForm } from "@/components/admin/rooms/room-form";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { deleteRoom } from "@/app/(admin)/admin/(protected)/rooms/actions";
import { hasPermission, requirePermissionPage, type AuthUser } from "@/lib/permissions";
import { roomRepository } from "@/server/repositories/room.repository";
import { roomTypeRepository } from "@/server/repositories/room-type.repository";
import { hotelService } from "@/server/services/hotel.service";
import { formatDateTime } from "@/lib/utils/display";

export default async function RoomEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermissionPage("rooms.read");
  const { id } = await params;
  const hotel = await hotelService.getDefaultHotel();

  const room = await roomRepository.findById(id);
  if (!room || room.hotelId !== hotel.id) notFound();

  const roomTypes = await roomTypeRepository.listActive(hotel.id);
  const canDelete = hasPermission(user.role as AuthUser["role"], "rooms.delete");

  return (
    <div className="space-y-5">
      <Link
        href="/admin/rooms"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        Back to rooms
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground">Room {room.roomNumber}</h1>
          <StatusBadge value={room.status} />
        </div>
        {canDelete ? (
          <ConfirmActionButton
            label="Delete room"
            variant="dangerGhost"
            confirmTitle={`Delete room ${room.roomNumber}?`}
            confirmDescription="This room will be removed from the hotel. Rooms with active reservations cannot be deleted."
            confirmLabel="Delete room"
            icon={<Trash2 aria-hidden className="h-4 w-4" />}
            action={deleteRoom}
            actionArgs={[room.id]}
            redirectTo="/admin/rooms"
          />
        ) : null}
      </div>

      <Card>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          <RoomForm
            roomTypes={roomTypes.map((roomType) => ({ id: roomType.id, name: roomType.name }))}
            room={{
              id: room.id,
              roomNumber: room.roomNumber,
              roomTypeId: room.roomTypeId,
              floor: room.floor,
              status: room.status,
            }}
          />
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                Room type
              </p>
              <p className="mt-1 text-sm text-foreground">{room.roomType.name}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                Created
              </p>
              <p className="mt-1 text-sm text-foreground">{formatDateTime(room.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                Last updated
              </p>
              <p className="mt-1 text-sm text-foreground">{formatDateTime(room.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
