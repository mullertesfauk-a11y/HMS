import { z } from "zod";

import { hotelDateToUtc, isValidDateRange } from "@/lib/dates";

export const hotelDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format")
  .refine((value) => hotelDateToUtc(value) !== null, "Not a valid calendar date");

/** Validates that two "YYYY-MM-DD" dates form a valid range. */
export function isHotelDateRange(checkIn: string, checkOut: string): boolean {
  const inDate = hotelDateToUtc(checkIn);
  const outDate = hotelDateToUtc(checkOut);
  if (!inDate || !outDate) return false;
  return isValidDateRange(inDate, outDate);
}

export const availabilityQuerySchema = z
  .object({
    checkIn: hotelDateSchema,
    checkOut: hotelDateSchema,
    adults: z.coerce.number().int().min(1).max(20).default(1),
    children: z.coerce.number().int().min(0).max(10).default(0),
  })
  .refine((data) => isHotelDateRange(data.checkIn, data.checkOut), {
    message: "checkIn must be before checkOut",
    path: ["checkOut"],
  });

export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;
