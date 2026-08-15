import type { NextRequest } from "next/server";

import { handleError, ok } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/request";
import { requirePermission } from "@/lib/permissions";
import { updateGuestSchema } from "@/lib/validation/guest";
import { guestService } from "@/server/services/guest.service";

/** GET — guest detail with reservation history. */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/v1/admin/guests/[id]">) {
  try {
    await requirePermission("guests.read");
    const { id } = await ctx.params;
    const guest = await guestService.getWithHistory(id);
    return ok(guest);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/v1/admin/guests/[id]">,
) {
  try {
    await requirePermission("guests.update");
    const { id } = await ctx.params;
    const body = await parseJsonBody(request);
    const parsed = updateGuestSchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }
    const guest = await guestService.update(id, parsed.data);
    return ok(guest);
  } catch (error) {
    return handleError(error);
  }
}
