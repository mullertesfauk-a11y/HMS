import { z } from "zod";

import { RoomStatus } from "@/generated/prisma/client";

export const roomStatusSchema = z.enum([
  RoomStatus.AVAILABLE,
  RoomStatus.OCCUPIED,
  RoomStatus.MAINTENANCE,
  RoomStatus.OUT_OF_SERVICE,
]);

export const createRoomSchema = z.object({
  hotelId: z.string().cuid().optional(),
  roomTypeId: z.string().cuid(),
  roomNumber: z.string().trim().min(1).max(10),
  floor: z.number().int().min(0).max(999).optional(),
  status: roomStatusSchema.default(RoomStatus.AVAILABLE),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;

export const updateRoomSchema = z
  .object({
    roomTypeId: z.string().cuid().optional(),
    roomNumber: z.string().trim().min(1).max(10).optional(),
    floor: z.number().int().min(0).max(999).optional(),
    status: roomStatusSchema.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
