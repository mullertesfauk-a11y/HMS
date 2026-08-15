"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { requirePermission } from "@/lib/permissions";
import { UserRole, UserStatus } from "@/generated/prisma/client";
import { staffService } from "@/server/services/staff.service";

function revalidate() {
  revalidatePath("/admin/staff");
}

export interface StaffFormState {
  error?: string;
}

/** Create a staff account (ADMIN). */
export async function createStaff(input: {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}): Promise<StaffFormState> {
  try {
    const actor = await requirePermission("staff.create");
    await staffService.create({ ...input, role: input.role ?? UserRole.STAFF }, await headers(), actor.id);
    revalidate();
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
}

/** Change a staff member's role (ADMIN). */
export async function updateStaffRole(
  userId: string,
  role: UserRole,
): Promise<{ ok?: true; error?: string }> {
  try {
    await requirePermission("staff.update");
    await staffService.update(userId, { role }, await headers());
    revalidate();
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
}

/** Enable or disable a staff account (ADMIN). */
export async function setStaffStatus(
  userId: string,
  status: UserStatus,
): Promise<{ ok?: true; error?: string }> {
  try {
    await requirePermission("staff.update");
    await staffService.update(userId, { status }, await headers());
    revalidate();
    return { ok: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
}
