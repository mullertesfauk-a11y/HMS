import type { NextRequest } from "next/server";
import { headers } from "next/headers";

import { buildPaginationMeta } from "@/lib/api/pagination";
import { handleError, ok, created } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/request";
import { requirePermission } from "@/lib/permissions";
import { adminStaffListSchema, parseListQuery } from "@/lib/validation/admin";
import { UserRole, UserStatus } from "@/generated/prisma/client";
import { staffCreateSchema } from "@/lib/validation/staff";
import { staffService } from "@/server/services/staff.service";

/** GET  /api/v1/admin/staff — searchable/filterable/paginated staff list */
export async function GET(request: NextRequest) {
  try {
    await requirePermission("staff.read");
    const query = parseListQuery(
      adminStaffListSchema,
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const { items, total } = await staffService.list({
      search: query.search,
      role: query.role as UserRole | undefined,
      status: query.status as UserStatus | undefined,
      page: query.page,
      pageSize: query.pageSize,
    });
    return ok(items, buildPaginationMeta(query.page, query.pageSize, total));
  } catch (error) {
    return handleError(error);
  }
}

/** POST — create a staff account (ADMIN only). */
export async function POST(request: NextRequest) {
  try {
    const actor = await requirePermission("staff.create");
    const body = await parseJsonBody(request);
    const parsed = staffCreateSchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }
    const user = await staffService.create(parsed.data, await headers(), actor.id);
    return created(user);
  } catch (error) {
    return handleError(error);
  }
}
