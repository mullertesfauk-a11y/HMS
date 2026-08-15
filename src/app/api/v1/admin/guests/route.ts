import type { NextRequest } from "next/server";

import { buildPaginationMeta } from "@/lib/api/pagination";
import { handleError, ok } from "@/lib/api/response";
import { requirePermission } from "@/lib/permissions";
import { adminGuestListSchema, parseListQuery } from "@/lib/validation/admin";
import { guestService } from "@/server/services/guest.service";

/** GET — searchable/paginated guest list. */
export async function GET(request: NextRequest) {
  try {
    await requirePermission("guests.read");
    const query = parseListQuery(
      adminGuestListSchema,
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const { items, total } = await guestService.list({
      search: query.search,
      page: query.page,
      pageSize: query.pageSize,
    });
    return ok(items, buildPaginationMeta(query.page, query.pageSize, total));
  } catch (error) {
    return handleError(error);
  }
}
