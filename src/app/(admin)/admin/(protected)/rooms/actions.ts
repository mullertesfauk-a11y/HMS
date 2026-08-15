"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/permissions";
import { RoomStatus } from "@/generated/prisma/client";
import { roomService } from "@/server/services/room.service";
import { hotelService } from "@/server/services/hotel.service";

function revalidate() {
  revalidatePath("/admin/rooms");
  revalidatePath("/admin/dashboard");
}

export interface RoomFormState {
  error?: string;
}

/** Create a room (ADMIN). */
export async function createRoom(input: {
  roomTypeId: string;
  roomNumber: string;
  floor?: number;
  status?: RoomStatus;
}): Promise<RoomFormState> {
  try {
    await requirePermission("rooms.create");
    const hotel = await hotelService.getDefaultHotel();
    await roomService.create(input, hotel.id);
    revalidate();
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
}

/** Update a room. */
export async function updateRoom(
  roomId: string,
  input: {
    roomTypeId?: string;
    roomNumber?: string;
    floor?: number;
    status?: RoomStatus;
  },
): Promise<RoomFormState> {
  try {
    await requirePermission("rooms.update");
    await roomService.update(roomId, input);
    revalidate();
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
}

/** Delete a room (ADMIN). */
export async function deleteRoom(roomId: string): Promise<{ ok?: true; error?: string }> {
  try {
    await requirePermission("rooms.delete");
    await roomService.delete(roomId);
    revalidate();
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
}
