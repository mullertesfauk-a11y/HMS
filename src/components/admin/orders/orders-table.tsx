"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DataTable, type TableSort } from "@/components/admin/data-table";
import { DataTablePagination } from "@/components/admin/data-table-pagination";
import { orderColumns, type OrderRow } from "@/components/admin/orders/order-columns";

/** Client table for the orders list. All state lives in the URL. */
export function OrdersTable({
  rows,
  currency,
  sort,
  page,
  pageSize,
  total,
  totalPages,
}: {
  rows: OrderRow[];
  currency: string;
  sort: TableSort | null;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function navigate(update: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    update(params);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-3">
      <DataTable
        columns={orderColumns(currency)}
        data={rows}
        getRowId={(row) => row.id}
        sort={sort}
        onSortChange={(next) => {
          navigate((params) => {
            if (next) {
              params.set("sortBy", next.id);
              params.set("sortOrder", next.desc ? "desc" : "asc");
            } else {
              params.delete("sortBy");
              params.delete("sortOrder");
            }
            params.delete("page");
          });
        }}
        onRowClick={(row) => router.push(`/admin/orders/${row.id}`)}
        emptyTitle="No orders found"
        emptyDescription="Orders placed from the menu will appear here."
      />
      <DataTablePagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        onPageChange={(nextPage) =>
          navigate((params) => {
            params.set("page", String(nextPage));
          })
        }
        onPageSizeChange={(nextSize) =>
          navigate((params) => {
            params.set("pageSize", String(nextSize));
            params.delete("page");
          })
        }
      />
    </div>
  );
}
