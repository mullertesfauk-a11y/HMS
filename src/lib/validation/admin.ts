import { z } from "zod";

import {
  PaymentStatus,
  ReservationStatus,
  RoomStatus,
  RoomTypeStatus,
  UserRole,
  UserStatus,
} from "@/generated/prisma/client";
import { paginationQuerySchema } from "@/lib/api/pagination";
import { hotelDateSchema } from "@/lib/validation/availability";

const enumValues = <T extends Record<string, string>>(enumObject: T) =>
  Object.values(enumObject) as [string, ...string[]];

const paginationShape = paginationQuerySchema.shape;

export const adminReservationListSchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(enumValues(ReservationStatus)).optional(),
  paymentStatus: z.enum(enumValues(PaymentStatus)).optional(),
  roomTypeId: z.string().cuid().optional(),
  checkInFrom: hotelDateSchema.optional(),
  checkInTo: hotelDateSchema.optional(),
  checkOutFrom: hotelDateSchema.optional(),
  checkOutTo: hotelDateSchema.optional(),
  ...paginationShape,
});

export type AdminReservationListQuery = z.infer<typeof adminReservationListSchema>;

export const adminRoomListSchema = z.object({
  search: z.string().trim().max(100).optional(),
  roomTypeId: z.string().cuid().optional(),
  floor: z.coerce.number().int().min(0).max(999).optional(),
  status: z.enum(enumValues(RoomStatus)).optional(),
  ...paginationShape,
});

export const adminRoomTypeListSchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.enum(enumValues(RoomTypeStatus)).optional(),
  ...paginationShape,
});

export const adminGuestListSchema = z.object({
  search: z.string().trim().max(100).optional(),
  ...paginationShape,
});

export const adminStaffListSchema = z.object({
  search: z.string().trim().max(100).optional(),
  role: z.enum(enumValues(UserRole)).optional(),
  status: z.enum(enumValues(UserStatus)).optional(),
  ...paginationShape,
});

/** Parses a URLSearchParams-like object into a validated list query. */
export function parseListQuery<T extends z.ZodTypeAny>(
  schema: T,
  query: Record<string, string | string[] | undefined>,
): z.infer<T> {
  const raw: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(query)) {
    raw[key] = Array.isArray(value) ? value[0] : value;
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw result.error;
  }
  return result.data as z.infer<T>;
}
