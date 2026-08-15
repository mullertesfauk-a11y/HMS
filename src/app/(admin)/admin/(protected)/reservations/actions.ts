"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/permissions";
import { reservationService } from "@/server/services/reservation.service";

/**
 * Reservation mutation actions for the admin UI.
 *
 * Every action re-checks the actor's permission server-side and delegates to
 * the reservation domain service (state machine + transactions + audit). The
 * UI stays a thin caller — the API layer shares the same services.
 */

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
