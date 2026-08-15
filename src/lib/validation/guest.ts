import { z } from "zod";

import { GuestDocumentType } from "@/generated/prisma/client";

export const guestDocumentTypeSchema = z.enum([
  GuestDocumentType.PASSPORT,
  GuestDocumentType.NATIONAL_ID,
  GuestDocumentType.DRIVERS_LICENSE,
  GuestDocumentType.OTHER,
]);

export const createGuestSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.email("Invalid email address").max(255).optional(),
  phone: z.string().trim().max(50).optional(),
  country: z.string().trim().max(100).optional(),
  documentType: guestDocumentTypeSchema.optional(),
  documentNumber: z.string().trim().max(100).optional(),
  specialNotes: z.string().trim().max(2000).optional(),
});

export type CreateGuestInput = z.infer<typeof createGuestSchema>;

export const updateGuestSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    email: z.email("Invalid email address").max(255).optional(),
    phone: z.string().trim().max(50).optional(),
    country: z.string().trim().max(100).optional(),
    documentType: guestDocumentTypeSchema.optional(),
    documentNumber: z.string().trim().max(100).optional(),
    specialNotes: z.string().trim().max(2000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

export type UpdateGuestInput = z.infer<typeof updateGuestSchema>;
