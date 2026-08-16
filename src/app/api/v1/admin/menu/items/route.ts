import type { NextRequest } from "next/server";

import { handleError, ok, created } from "@/lib/api/response";
import { buildPaginationMeta, parsePaginationQuery } from "@/lib/api/pagination";
import { parseJsonBody } from "@/lib/api/request";
import { requirePermission } from "@/lib/permissions";
import { adminMenuItemListSchema, parseListQuery } from "@/lib/validation/admin";
import { createMenuItemSchema } from "@/lib/validation/menu";
import { menuService } from "@/server/services/menu.service";

/** GET /api/v1/admin/menu/items — searchable/filterable/paginated list. */
export async function GET(request: NextRequest) {
  try {
    await requirePermission("menu.read");

    const query = parseListQuery(
      adminMenuItemListSchema,
      Object.fromEntries(request.nextUrl.searchParams),
    );
    const { skip, take } = parsePaginationQuery({
      page: String(query.page),
      pageSize: String(query.pageSize),
    });

    const { items, total } = await menuService.listItems({
      search: query.search,
      categoryId: query.categoryId,
      isAvailable: query.isAvailable,
      skip,
      take,
    });

    return ok(items, buildPaginationMeta(query.page, query.pageSize, total));
  } catch (error) {
    return handleError(error);
  }
}

/** POST /api/v1/admin/menu/items — create an item (menu.create). */
export async function POST(request: NextRequest) {
  try {
    await requirePermission("menu.create");
    const body = await parseJsonBody(request);
    const parsed = createMenuItemSchema.safeParse(body);
    if (!parsed.success) {
      return handleError(parsed.error);
    }
    const item = await menuService.createItem(parsed.data);
    return created(item);
  } catch (error) {
    return handleError(error);
  }
}
