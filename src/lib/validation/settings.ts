import { z } from "zod";

/**
 * Hotel settings (admin). Currency/timezone are deliberately NOT editable in
 * the MVP — changing them would corrupt existing reservation values.
 */
export const updateHotelSettingsSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(4000).optional(),
    address: z.string().trim().max(300).optional(),
    city: z.string().trim().max(100).optional(),
    country: z.string().trim().max(100).optional(),
    phone: z.string().trim().max(50).optional(),
    email: z.email("Invalid email address").max(255).optional(),
    checkInTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24h)").optional(),
    checkOutTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24h)").optional(),
    taxRate: z.coerce.number().min(0).max(100).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

export type UpdateHotelSettingsInput = z.infer<typeof updateHotelSettingsSchema>;
