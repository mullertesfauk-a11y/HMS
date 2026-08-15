import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { RoomForm } from "@/components/admin/rooms/room-form";
import { requirePermissionPage } from "@/lib/permissions";
import { roomTypeRepository } from "@/server/repositories/room-type.repository";
import { hotelService } from "@/server/services/hotel.service";

export default async function NewRoomPage() {
  await requirePermissionPage("rooms.create");
  const hotel = await hotelService.getDefaultHotel();
  const roomTypes = await roomTypeRepository.listActive(hotel.id);

  return (
    <div className="space-y-5">
      <Link
        href="/admin/rooms"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        Back to rooms
      </Link>
      <div>
        <h1 className="text-xl font-semibold text-foreground">New room</h1>
        <p className="mt-0.5 text-sm text-stone-500">Add a physical room to the hotel.</p>
      </div>
      <RoomForm roomTypes={roomTypes.map((roomType) => ({ id: roomType.id, name: roomType.name }))} />
    </div>
  );
}
