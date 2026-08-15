import { z } from "zod";

import { UserRole, UserStatus } from "@/generated/prisma/client";

export const staffRoleSchema = z.enum([UserRole.ADMIN, UserRole.STAFF]);

/**
 * Admin creates staff accounts. Passwords are handled by Better Auth's
 * password hashing — never stored in plaintext and never returned by APIs.
 */
export const staffCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.email("Invalid email address").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  role: staffRoleSchema.default(UserRole.STAFF),
});

export type StaffCreateInput = z.infer<typeof staffCreateSchema>;

export const staffUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    role: staffRoleSchema.optional(),
    status: z.enum([UserStatus.ACTIVE, UserStatus.DISABLED]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, "At least one field is required");

export type StaffUpdateInput = z.infer<typeof staffUpdateSchema>;
