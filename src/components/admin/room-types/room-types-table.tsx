"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createAppColumnHelper } from "@/components/admin/table-hooks";

import { DataTable, type TableSort } from "@/components/admin/data-table";
import { DataTablePagination } from "@/components/admin/data-table-pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDateTime, formatMoney } from "@/lib/utils/display";

export interface RoomTypeRow {
  id: string;
  name: string;
  bedType: string;
  capacity: number;
  basePrice: number;
  rooms: number;
  status: string;
  updatedAt: string;
}

const columnHelper = createAppColumnHelper<RoomTypeRow>();

export function RoomTypesTable({
  roomTypes,
  currency,
  sort,
  page,
  pageSize,
  total,
  totalPages,
}: {
  roomTypes: RoomTypeRow[];
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

  const columns = [
    columnHelper.accessor("name", {
      header: "Name",
      enableSorting: false,
      cell: (info) => <span className="font-medium text-foreground">{info.getValue()}</span>,
    }),
    columnHelper.accessor("capacity", {
      header: "Capacity",
      enableSorting: false,
      cell: (info) => (
        <span className="text-stone-600">
          {info.getValue()} guest{info.getValue() === 1 ? "" : "s"}
        </span>
      ),
    }),
    columnHelper.accessor("bedType", {
      header: "Bed type",
      enableSorting: false,
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("basePrice", {
      header: "Base price",
      enableSorting: true,
      cell: (info) => (
        <span className="font-medium text-foreground">
          {formatMoney(info.getValue(), currency)}
        </span>
      ),
    }),
    columnHelper.accessor("rooms", {
      header: "Rooms",
      enableSorting: false,
      cell: (info) => <span className="text-stone-600">{info.getValue()}</span>,
    }),
    columnHelper.accessor("status", {
      header: "Status",
      enableSorting: true,
      cell: (info) => <StatusBadge value={info.getValue()} />,
    }),
    columnHelper.accessor("updatedAt", {
      header: "Updated",
      enableSorting: true,
      cell: (info) => (
        <span className="text-stone-500">{formatDateTime(info.getValue())}</span>
      ),
    }),
  ];

  return (
    <div className="space-y-3">
      <DataTable
        columns={columns}
        data={roomTypes}
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
        onRowClick={(row) => router.push(`/admin/room-types/${row.id}`)}
        emptyTitle="No room types found"
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
