import { Suspense } from "react";

import { TableSkeleton } from "@/components/admin/table-skeleton";
import { OrderToolbar } from "@/components/admin/orders/order-toolbar";
import { OrdersTable } from "@/components/admin/orders/orders-table";
import type { OrderRow } from "@/components/admin/orders/order-columns";
import type { TableSort } from "@/components/admin/data-table";
import { buildPaginationMeta, parsePaginationQuery } from "@/lib/api/pagination";
import { requirePermissionPage } from "@/lib/permissions";
import { OrderStatus } from "@/generated/prisma/client";
import { adminOrderListSchema, parseListQuery } from "@/lib/validation/admin";
import { hotelDateToUtc } from "@/lib/dates";
import { orderService } from "@/server/services/order.service";
import { hotelService } from "@/server/services/hotel.service";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermissionPage("orders.read");
  const hotel = await hotelService.getDefaultHotel();
  const rawParams = await searchParams;

  let query: ReturnType<typeof parseListQuery<typeof adminOrderListSchema>>;
  try {
    query = parseListQuery(adminOrderListSchema, rawParams);
  } catch {
    query = parseListQuery(adminOrderListSchema, {});
  }

  const { page, pageSize, skip, take, sortOrder } = parsePaginationQuery({
    page: String(query.page),
    pageSize: String(query.pageSize),
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  });

  const orderByMap: Record<string, object> = {
    createdAt: { createdAt: sortOrder },
    status: { status: sortOrder },
    total: { total: sortOrder },
    guestName: { guestName: sortOrder },
  };
  const sort: TableSort | null = query.sortBy
    ? { id: query.sortBy, desc: sortOrder === "desc" }
    : null;

  // dateTo is inclusive: cover the whole day.
  const dateTo = query.dateTo ? hotelDateToUtc(query.dateTo) : undefined;

  const { items, total } = await orderService.listOrders({
    hotelId: hotel.id,
    search: query.search,
    status: query.status as OrderStatus | undefined,
    dateFrom: query.dateFrom ? hotelDateToUtc(query.dateFrom)! : undefined,
    dateTo: dateTo ? new Date(dateTo.getTime() + 86_400_000 - 1) : undefined,
    skip,
    take,
    orderBy: (query.sortBy && orderByMap[query.sortBy]) || { createdAt: "desc" as const },
  });

  const rows: OrderRow[] = items.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    guestName: order.guestName,
    guestPhone: order.guestPhone,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    total: order.total.toNumber(),
    status: order.status,
    createdAt: order.createdAt.toISOString(),
  }));

  const meta = buildPaginationMeta(page, pageSize, total);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Orders</h1>
        <p className="mt-0.5 text-sm text-stone-500">
          Food orders placed from the menu, ready to fulfill.
        </p>
      </div>

      <OrderToolbar statuses={Object.values(OrderStatus)} />

      <Suspense fallback={<TableSkeleton rows={10} columns={8} />}>
        <OrdersTable
          rows={rows}
          currency={hotel.currency}
          sort={sort}
          page={meta.page}
          pageSize={meta.pageSize}
          total={meta.total}
          totalPages={meta.totalPages}
        />
      </Suspense>
    </div>
  );
}
