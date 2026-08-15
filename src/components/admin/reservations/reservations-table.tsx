"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DataTable, type TableSort } from "@/components/admin/data-table";
import { DataTablePagination } from "@/components/admin/data-table-pagination";
import { reservationColumns, type ReservationRow } from "@/components/admin/reservations/reservation-columns";

/**
 * Client table for the reservations list. All state lives in the URL:
 * sorting, pagination, and row-click navigation are handled here.
 */
export function ReservationsTable({
  rows,
  currency,
  sort,
  page,
  pageSize,
  total,
  totalPages,
}: {
  rows: ReservationRow[];
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
        columns={reservationColumns(currency)}
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
        onRowClick={(row) => router.push(`/admin/reservations/${row.id}`)}
        emptyTitle="No reservations found"
        emptyDescription="Try adjusting the search or filters."
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
