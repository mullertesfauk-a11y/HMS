"use server";

import { headers } from "next/headers";

import { enforceRateLimit } from "@/lib/rate-limit";
import { ValidationError } from "@/lib/errors";
import {
  cancelReservationSchema,
  createReservationSchema,
  reservationLookupSchema,
  type CreateReservationInput,
} from "@/lib/validation/reservation";
import { reservationService } from "@/server/services/reservation.service";
import { orderService } from "@/server/services/order.service";
import { hotelService } from "@/server/services/hotel.service";
import { toPublicReservationView, type PublicReservationView } from "@/server/services/reservation.view";
import { toPublicOrderView, type PublicOrderView } from "@/server/services/order.view";
import { createOrderSchema, orderLookupSchema, type CreateOrderInput } from "@/lib/validation/order";
import { z } from "zod";

/**
 * Public website server actions.
 *
 * These are the same domain operations the API routes expose, called directly
 * from server components/actions (no self-HTTP round-trip). Rate limiting uses
 * the real client IP from request headers — the in-memory limiter must never
 * see the server's own address.
 */

/**
 * Best-effort client IP for rate-limit keys (mirrors src/lib/api/request.ts).
 * Falls back to "unknown" outside a request context (e.g. unit tests).
 */
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

/** Readable message from a Zod validation failure. */
function validationMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}

export type BookingResult =
  | { ok: true; reservation: PublicReservationView }
  | { ok: false; error: string };

/** Create a reservation from the public website (rate limited). */
export async function createBooking(input: CreateReservationInput): Promise<BookingResult> {
  try {
    const ip = await getClientIp();
    await enforceRateLimit(`website:booking:${ip}`, { limit: 10, windowMs: 60_000 });

    const parsed = createReservationSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: validationMessage(parsed.error) };

    const hotel = await hotelService.getDefaultHotel();
    const reservation = await reservationService.createReservation(parsed.data, {
      hotelId: hotel.id,
      currency: hotel.currency,
      taxRate: hotel.taxRate.toNumber(),
      ipAddress: ip,
    });

    return { ok: true, reservation: toPublicReservationView(reservation) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong" };
  }
}

export type LookupResult =
  | { ok: true; reservation: PublicReservationView }
  | { ok: false; error: string };

/** Public lookup by reservation number + last name (rate limited). */
export async function lookupReservation(input: {
  reservationNumber: string;
  lastName: string;
}): Promise<LookupResult> {
  try {
    const ip = await getClientIp();
    await enforceRateLimit(`website:lookup:${ip}`, { limit: 20, windowMs: 60_000 });

    const parsed = reservationLookupSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: validationMessage(parsed.error) };

    const reservation = await reservationService.lookup(parsed.data);
    return { ok: true, reservation: toPublicReservationView(reservation) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong" };
  }
}

export type CancelResult =
  | { ok: true; reservation: PublicReservationView }
  | { ok: false; error: string };

/** Public cancellation by reservation number + last name (rate limited). */
export async function cancelReservation(input: {
  reservationNumber: string;
  lastName: string;
}): Promise<CancelResult> {
  try {
    const ip = await getClientIp();
    await enforceRateLimit(`website:cancel:${ip}`, { limit: 10, windowMs: 60_000 });

    const parsed = cancelReservationSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: validationMessage(parsed.error) };
    // Guard against invalid numbers even when the schema passes a malformed value.
    if (!/^[A-Z0-9-]{1,30}$/.test(parsed.data.reservationNumber)) {
      throw new ValidationError("Reservation number is invalid");
    }

    const reservation = await reservationService.cancelPublic(parsed.data, { ipAddress: ip });
    return { ok: true, reservation: toPublicReservationView(reservation) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong" };
  }
}

// ---------------------------------------------------------------------------
// Food ordering
// ---------------------------------------------------------------------------

export type OrderResult =
  | { ok: true; order: PublicOrderView }
  | { ok: false; error: string };

/** Place a food order from the public website (rate limited). */
export async function placeOrder(input: CreateOrderInput): Promise<OrderResult> {
  try {
    const ip = await getClientIp();
    await enforceRateLimit(`website:order:${ip}`, { limit: 10, windowMs: 60_000 });

    const parsed = createOrderSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: validationMessage(parsed.error) };

    const hotel = await hotelService.getDefaultHotel();
    const order = await orderService.createOrder(parsed.data, {
      hotelId: hotel.id,
      currency: hotel.currency,
      taxRate: hotel.taxRate.toNumber(),
      ipAddress: ip,
    });

    return { ok: true, order: toPublicOrderView(order) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong" };
  }
}

export type OrderLookupResult =
  | { ok: true; order: PublicOrderView }
  | { ok: false; error: string };

/** Public order lookup by order number + phone (rate limited). */
export async function lookupOrder(input: {
  orderNumber: string;
  guestPhone: string;
}): Promise<OrderLookupResult> {
  try {
    const ip = await getClientIp();
    await enforceRateLimit(`website:order-lookup:${ip}`, { limit: 20, windowMs: 60_000 });

    const parsed = orderLookupSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: validationMessage(parsed.error) };

    const order = await orderService.lookup(parsed.data);
    return { ok: true, order: toPublicOrderView(order) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Something went wrong" };
  }
}
