import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { RoomTypeForm } from "@/components/admin/room-types/room-type-form";
import { requirePermissionPage } from "@/lib/permissions";
import { prisma } from "@/lib/db/prisma";

export default async function NewRoomTypePage() {
  await requirePermissionPage("roomTypes.create");
  const amenities = await prisma.amenity.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-5">
      <Link
        href="/admin/room-types"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        Back to room types
      </Link>
      <div>
        <h1 className="text-xl font-semibold text-foreground">New room type</h1>
        <p className="mt-0.5 text-sm text-stone-500">
          A category guests book (e.g. Deluxe Room) — not a physical room.
        </p>
      </div>
      <RoomTypeForm amenities={amenities.map((amenity) => ({ id: amenity.id, name: amenity.name }))} />
    </div>
  );
}
