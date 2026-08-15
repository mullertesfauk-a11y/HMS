import type { NextRequest } from "next/server";
import { headers } from "next/headers";

import { handleError, ok } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/request";
import { requirePermission } from "@/lib/permissions";
import { staffUpdateSchema } from "@/lib/validation/staff";
import { staffService } from "@/server/services/staff.service";

/** GET — staff member detail. */
export async function GET(_request: NextRequest, ctx: RouteContext<"/api/v1/admin/staff/[id]">) {
  try {
    await requirePermission("staff.read");
    const { id } = await ctx.params;
    const staff = await staffService.get(id);
    return ok(staff);
  } catch (error) {
    return handleError(error);
  }
}

/** PATCH — update name / role / status. */
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/v1/admin/staff/[id]">,
) {
  try {
    await requirePermission("staff.update");
    const { id } = await ctx.params;
    const body = await parseJsonBody(request);
    const parsed = staffUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }
    const staff = await staffService.update(id, parsed.data, await headers());
    return ok(staff);
  } catch (error) {
    return handleError(error);
  }
}
