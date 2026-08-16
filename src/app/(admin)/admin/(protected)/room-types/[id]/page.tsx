import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";

import { RoomTypeForm } from "@/components/admin/room-types/room-type-form";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { StatusBadge } from "@/components/admin/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { deleteRoomType } from "@/app/(admin)/admin/(protected)/room-types/actions";
import { hasPermission, requirePermissionPage, type AuthUser } from "@/lib/permissions";
import { prisma } from "@/lib/db/prisma";
import { roomTypeRepository } from "@/server/repositories/room-type.repository";
import { hotelService } from "@/server/services/hotel.service";
import { formatMoney } from "@/lib/utils/display";

export default async function RoomTypeEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePermissionPage("roomTypes.read");
  const { id } = await params;

  const roomType = await roomTypeRepository.findById(id);
  if (!roomType) notFound();

  const hotel = await hotelService.getDefaultHotel();
  const [amenities, roomCount] = await Promise.all([
    prisma.amenity.findMany({ orderBy: { name: "asc" } }),
    prisma.room.count({ where: { roomTypeId: id } }),
  ]);
  const canDelete = hasPermission(user.role as AuthUser["role"], "roomTypes.delete");

  return (
    <div className="space-y-5">
      <Link
        href="/admin/room-types"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        Back to room types
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground">{roomType.name}</h1>
          <StatusBadge value={roomType.status} />
        </div>
        {canDelete ? (
          <ConfirmActionButton
            label="Delete room type"
            variant="dangerGhost"
            confirmTitle={`Delete ${roomType.name}?`}
            confirmDescription="Room types referenced by rooms or reservations cannot be deleted."
            confirmLabel="Delete room type"
            icon={<Trash2 aria-hidden className="h-4 w-4" />}
            action={deleteRoomType}
            actionArgs={[roomType.id]}
            redirectTo="/admin/room-types"
          />
        ) : null}
      </div>

      <Card>
        <CardContent className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <RoomTypeForm
            amenities={amenities.map((amenity) => ({ id: amenity.id, name: amenity.name }))}
            roomType={{
              id: roomType.id,
              name: roomType.name,
              description: roomType.description,
              capacity: roomType.capacity,
              maxAdults: roomType.maxAdults,
              maxChildren: roomType.maxChildren,
              bedType: roomType.bedType,
              size: roomType.size,
              imageUrl: roomType.imageUrl,
              basePrice: roomType.basePrice.toNumber(),
              status: roomType.status,
              amenityIds: roomType.amenities.map((link) => link.amenityId),
            }}
          />
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                Rooms in this type
              </p>
              <p className="mt-1 text-sm text-foreground">{roomCount}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                Base price
              </p>
              <p className="mt-1 text-sm text-foreground">
                {formatMoney(roomType.basePrice.toNumber(), hotel.currency)}
              </p>
            </div>
            {roomType.amenities.length > 0 ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                  Amenities
                </p>
                <ul className="mt-1 space-y-0.5 text-sm text-stone-700">
                  {roomType.amenities.map((link) => (
                    <li key={link.amenityId}>{link.amenity.name}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
