"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/permissions";
import { RoomTypeStatus } from "@/generated/prisma/client";
import { roomTypeService } from "@/server/services/room-type.service";
import { hotelService } from "@/server/services/hotel.service";

function revalidate() {
  revalidatePath("/admin/room-types");
  revalidatePath("/admin/dashboard");
}

export interface RoomTypeFormState {
  error?: string;
}

export async function createRoomType(input: {
  name: string;
  description?: string;
  capacity: number;
  maxAdults: number;
  maxChildren?: number;
  bedType: string;
  size?: string;
  basePrice: number;
  status?: RoomTypeStatus;
  amenityIds?: string[];
}): Promise<RoomTypeFormState> {
  try {
    await requirePermission("roomTypes.create");
    const hotel = await hotelService.getDefaultHotel();
    await roomTypeService.create(
      { ...input, maxChildren: input.maxChildren ?? 0 },
      hotel.id,
    );
    revalidate();
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
}

export async function updateRoomType(
  roomTypeId: string,
  input: {
    name?: string;
    description?: string;
    capacity?: number;
    maxAdults?: number;
    maxChildren?: number;
    bedType?: string;
    size?: string;
    basePrice?: number;
    status?: RoomTypeStatus;
    amenityIds?: string[];
  },
): Promise<RoomTypeFormState> {
  try {
    await requirePermission("roomTypes.update");
    await roomTypeService.update(roomTypeId, input);
    revalidate();
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
}

export async function deleteRoomType(roomTypeId: string): Promise<{ ok?: true; error?: string }> {
  try {
    await requirePermission("roomTypes.delete");
    await roomTypeService.delete(roomTypeId);
    revalidate();
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
}
