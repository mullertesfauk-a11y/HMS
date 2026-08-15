import type { NextRequest } from "next/server";
import { headers } from "next/headers";

import { handleError, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/permissions";
import { staffService } from "@/server/services/staff.service";

/** POST — disable a staff account (prevents sign-in via requireAuth status check). */
export async function POST(_request: NextRequest, ctx: RouteContext<"/api/v1/admin/staff/[id]/disable">) {
  try {
    await requirePermission("staff.disable");
    const { id } = await ctx.params;
    const staff = await staffService.disable(id, await headers());
    return ok(staff);
  } catch (error) {
    return handleError(error);
  }
}
