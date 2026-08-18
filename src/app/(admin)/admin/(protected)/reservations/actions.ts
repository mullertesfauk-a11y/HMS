"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requirePermission } from "@/lib/permissions";
import { hotelDateToUtc } from "@/lib/dates";
import {
  availabilityQuerySchema,
  hotelDateSchema,
  isHotelDateRange,
} from "@/lib/validation/availability";
import { adminCreateReservationSchema } from "@/lib/validation/reservation";
import { reservationService } from "@/server/services/reservation.service";
import { availabilityService } from "@/server/services/availability.service";
import { hotelService } from "@/server/services/hotel.service";

/**
 * Reservation mutation actions for the admin UI.
 *
 * Every action re-checks the actor's permission server-side and delegates to
 * the reservation domain service (state machine + transactions + audit). The
 * UI stays a thin caller — the API layer shares the same services.
 */

/** Best-effort client IP for the audit trail (falls back to "unknown"). */
async function getClientIp(): Promise<string> {
  try {
    const headerStore = await headers();
    const forwarded = headerStore.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0]!.trim();
    return headerStore.get("x-real-ip") ?? "unknown";
  } catch {
    return "unknown";
  }
}

function revalidate(id: string) {
  revalidatePath(`/admin/reservations/${id}`);
  revalidatePath("/admin/reservations");
  revalidatePath("/admin/dashboard");
}

export async function confirmReservation(reservationId: string) {
  const actor = await requirePermission("reservations.confirm");
  await reservationService.confirm(reservationId, actor.id);
  revalidate(reservationId);
  return { ok: true as const };
}

export async function cancelReservation(reservationId: string) {
  const actor = await requirePermission("reservations.cancel");
  await reservationService.cancelById(reservationId, actor.id);
  revalidate(reservationId);
  return { ok: true as const };
}

export async function checkInReservation(reservationId: string) {
  const actor = await requirePermission("reservations.checkin");
  await reservationService.checkIn(reservationId, actor.id);
  revalidate(reservationId);
  return { ok: true as const };
}

export async function checkOutReservation(reservationId: string) {
  const actor = await requirePermission("reservations.checkout");
  await reservationService.checkOut(reservationId, actor.id);
  revalidate(reservationId);
  return { ok: true as const };
}

export async function assignRoomToReservation(reservationId: string, roomId: string) {
  const actor = await requirePermission("reservations.update");
  await reservationService.assignRoom(reservationId, roomId, actor.id);
  revalidate(reservationId);
  return { ok: true as const };
}

// ---------------------------------------------------------------------------
// New reservation (walk-in booking)
// ---------------------------------------------------------------------------

export type CreateAdminReservationResult =
  | { ok: true; reservationId: string }
  | { ok: false; error: string };

/**
 * Create a reservation on behalf of a guest from the admin portal. Requires a
 * specific physical room (admin walk-in flow); the service re-validates
 * availability and pricing server-side inside one transaction.
 */
export async function createAdminReservation(
  input: z.infer<typeof adminCreateReservationSchema>,
): Promise<CreateAdminReservationResult> {
  try {
    const actor = await requirePermission("reservations.create");
    const parsed = adminCreateReservationSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const hotel = await hotelService.getDefaultHotel();
    const reservation = await reservationService.createReservation(parsed.data, {
      hotelId: hotel.id,
      currency: hotel.currency,
      taxRate: hotel.taxRate.toNumber(),
      createdById: actor.id,
      // Walk-in guests are physically present — skip pre-arrival statuses.
      checkInNow: parsed.data.checkInNow,
      ipAddress: await getClientIp(),
    });

    revalidate(reservation.id);
    return { ok: true, reservationId: reservation.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong" };
  }
}

export type SearchAdminAvailabilityResult =
  | { ok: true; results: Awaited<ReturnType<typeof availabilityService.searchAvailability>> }
  | { ok: false; error: string };

/**
 * Room types bookable for a stay with server-computed pricing — powers the
 * walk-in booking form's live quote. Same engine as the public availability
 * API, gated behind `reservations.create`.
 */
export async function searchAdminAvailability(input: {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
}): Promise<SearchAdminAvailabilityResult> {
  try {
    await requirePermission("reservations.create");
    const parsed = availabilityQuerySchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const hotel = await hotelService.getDefaultHotel();
    const results = await availabilityService.searchAvailability({
      hotelId: hotel.id,
      checkIn: hotelDateToUtc(parsed.data.checkIn)!,
      checkOut: hotelDateToUtc(parsed.data.checkOut)!,
      adults: parsed.data.adults,
      children: parsed.data.children,
      taxRate: hotel.taxRate.toNumber(),
    });

    return { ok: true, results };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong" };
  }
}

const freeRoomsSchema = z
  .object({
    roomTypeId: z.string().trim().min(1, "Room type is required"),
    checkIn: hotelDateSchema,
    checkOut: hotelDateSchema,
  })
  .refine((data) => isHotelDateRange(data.checkIn, data.checkOut), {
    message: "checkIn must be before checkOut",
    path: ["checkOut"],
  });

export type ListFreeRoomsResult =
  | {
      ok: true;
      rooms: { id: string; roomNumber: string; floor: number | null }[];
    }
  | { ok: false; error: string };

/** Physical rooms of a room type that are free for the stay (walk-in room picker). */
export async function listFreeRooms(input: {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
}): Promise<ListFreeRoomsResult> {
  try {
    await requirePermission("reservations.create");
    const parsed = freeRoomsSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
    }

    const hotel = await hotelService.getDefaultHotel();
    const rooms = await availabilityService.findAvailableRooms({
      hotelId: hotel.id,
      roomTypeId: parsed.data.roomTypeId,
      checkIn: hotelDateToUtc(parsed.data.checkIn)!,
      checkOut: hotelDateToUtc(parsed.data.checkOut)!,
    });

    return { ok: true, rooms };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong" };
  }
}
