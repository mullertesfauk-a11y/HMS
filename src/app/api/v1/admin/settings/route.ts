import type { NextRequest } from "next/server";

import { handleError, ok } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/request";
import { requirePermission } from "@/lib/permissions";
import { updateHotelSettingsSchema } from "@/lib/validation/settings";
import { hotelService } from "@/server/services/hotel.service";

/** GET — current hotel settings. */
export async function GET() {
  try {
    await requirePermission("settings.read");
    const settings = await hotelService.getSettings();
    return ok(settings);
  } catch (error) {
    return handleError(error);
  }
}

/** PATCH — update hotel settings (name, contact, times, tax rate). */
export async function PATCH(request: NextRequest) {
  try {
    await requirePermission("settings.update");
    const body = await parseJsonBody(request);
    const parsed = updateHotelSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }
    const settings = await hotelService.updateSettings(parsed.data);
    return ok(settings);
  } catch (error) {
    return handleError(error);
  }
}
