import { z } from "zod";

import { RoomTypeStatus } from "@/generated/prisma/client";

export const roomTypeStatusSchema = z.enum([RoomTypeStatus.ACTIVE, RoomTypeStatus.INACTIVE]);

export const createRoomTypeSchema = z.object({
  hotelId: z.string().cuid().optional(),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(2000).optional(),
  capacity: z.number().int().min(1).max(50),
  maxAdults: z.number().int().min(1).max(50),
  maxChildren: z.number().int().min(0).max(50).default(0),
  bedType: z.string().trim().min(1).max(100),
  size: z.string().trim().max(50).optional(),
  imageUrl: z.string().trim().url("Image URL must be a valid URL").max(500).optional(),
  basePrice: z.number().positive("Base price must be positive").max(1_000_000),
  status: roomTypeStatusSchema.default(RoomTypeStatus.ACTIVE),
  /** Optional amenity ids to attach to the room type. */
  amenityIds: z.array(z.string().cuid()).max(50).optional(),
});

export type CreateRoomTypeInput = z.infer<typeof createRoomTypeSchema>;

export const updateRoomTypeSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(2000).optional(),
    capacity: z.number().int().min(1).max(50).optional(),
    maxAdults: z.number().int().min(1).max(50).optional(),
    maxChildren: z.number().int().min(0).max(50).optional(),
    bedType: z.string().trim().min(1).max(100).optional(),
    size: z.string().trim().max(50).optional(),
    imageUrl: z.string().trim().url("Image URL must be a valid URL").max(500).optional(),
    basePrice: z.number().positive("Base price must be positive").max(1_000_000).optional(),
    status: roomTypeStatusSchema.optional(),
    amenityIds: z.array(z.string().cuid()).max(50).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

export type UpdateRoomTypeInput = z.infer<typeof updateRoomTypeSchema>;
