import { z } from "zod";

import { hotelDateSchema, isHotelDateRange } from "@/lib/validation/availability";

/**
 * Reservation schemas.
 *
 * Note: no price/total fields are accepted — the server always recalculates
 * pricing from the room type and stay length (see src/lib/domain/pricing.ts).
 */

export const guestDetailsSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  email: z.email("Invalid email address").max(255).optional(),
  phone: z.string().trim().max(50).optional(),
  country: z.string().trim().max(100).optional(),
  specialNotes: z.string().trim().max(2000).optional(),
});

export type GuestDetails = z.infer<typeof guestDetailsSchema>;

export const createReservationSchema = z
  .object({
    checkIn: hotelDateSchema,
    checkOut: hotelDateSchema,
    adults: z.number().int().min(1).max(20),
    children: z.number().int().min(0).max(10).default(0),
    /** Public bookings select a RoomType (by slug); physical rooms are assigned internally. */
    roomTypeSlug: z.string().trim().min(1, "Room type is required"),
    guest: guestDetailsSchema,
    specialRequests: z.string().trim().max(2000).optional(),
  })
  .refine((data) => isHotelDateRange(data.checkIn, data.checkOut), {
    message: "checkIn must be before checkOut",
    path: ["checkOut"],
  });

export type CreateReservationInput = z.infer<typeof createReservationSchema>;

/** Public lookup/cancel use reservationNumber + lastName for privacy. */
export const reservationLookupSchema = z.object({
  reservationNumber: z.string().trim().min(1, "Reservation number is required").max(30),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
});

export type ReservationLookupInput = z.infer<typeof reservationLookupSchema>;

export const cancelReservationSchema = reservationLookupSchema;
export type CancelReservationInput = z.infer<typeof cancelReservationSchema>;

/** Admin reservation edit (PATCH). Date changes re-check availability + reprice server-side. */
export const updateReservationSchema = z
  .object({
    checkIn: hotelDateSchema.optional(),
    checkOut: hotelDateSchema.optional(),
    adults: z.number().int().min(1).max(20).optional(),
    children: z.number().int().min(0).max(10).optional(),
    specialRequests: z.string().trim().max(2000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field is required")
  .refine(
    (data) => !(data.checkIn && data.checkOut) || isHotelDateRange(data.checkIn, data.checkOut),
    { message: "checkIn must be before checkOut", path: ["checkOut"] },
  );

export type UpdateReservationInput = z.infer<typeof updateReservationSchema>;
