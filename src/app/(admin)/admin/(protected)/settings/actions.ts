"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/permissions";
import { hotelService } from "@/server/services/hotel.service";

function revalidate() {
  revalidatePath("/admin/settings");
  revalidatePath("/admin/dashboard");
}

export interface SettingsFormState {
  error?: string;
}

export async function updateSettings(input: {
  name?: string;
  description?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  checkInTime?: string;
  checkOutTime?: string;
  taxRate?: number;
}): Promise<SettingsFormState> {
  try {
    await requirePermission("settings.update");
    await hotelService.updateSettings(input);
    revalidate();
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Something went wrong" };
  }
}
