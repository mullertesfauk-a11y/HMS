"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createAppColumnHelper } from "@/components/admin/table-hooks";

import { DataTable } from "@/components/admin/data-table";
import { DataTablePagination } from "@/components/admin/data-table-pagination";
import { formatDateFriendly, formatDateTime } from "@/lib/utils/display";

export interface GuestRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  reservations: number;
  lastStay: string | null;
  createdAt: string;
}

const columnHelper = createAppColumnHelper<GuestRow>();

export function GuestsTable({
  guests,
  page,
  pageSize,
  total,
  totalPages,
}: {
  guests: GuestRow[];
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
    columnHelper.accessor("email", {
      header: "Email",
      enableSorting: false,
      cell: (info) => (
        <span className="text-stone-600">{info.getValue() || <i className="text-stone-400">—</i>}</span>
      ),
    }),
    columnHelper.accessor("phone", {
      header: "Phone",
      enableSorting: false,
      cell: (info) => (
        <span className="text-stone-600">{info.getValue() ?? <i className="text-stone-400">—</i>}</span>
      ),
    }),
    columnHelper.accessor("country", {
      header: "Country",
      enableSorting: false,
      cell: (info) => (
        <span className="text-stone-600">{info.getValue() ?? <i className="text-stone-400">—</i>}</span>
      ),
    }),
    columnHelper.accessor("reservations", {
      header: "Reservations",
      enableSorting: false,
      cell: (info) => <span className="text-stone-600">{info.getValue()}</span>,
    }),
    columnHelper.accessor("lastStay", {
      header: "Last stay",
      enableSorting: false,
      cell: (info) => {
        const value = info.getValue();
        return value ? (
          <span className="text-stone-600">{formatDateFriendly(value)}</span>
        ) : (
          <span className="text-stone-400">—</span>
        );
      },
    }),
    columnHelper.accessor("createdAt", {
      header: "Created",
      enableSorting: false,
      cell: (info) => (
        <span className="text-stone-500">{formatDateTime(info.getValue())}</span>
      ),
    }),
  ];

  return (
    <div className="space-y-3">
      <DataTable
        columns={columns}
        data={guests}
        getRowId={(row) => row.id}
        onRowClick={(row) => router.push(`/admin/guests/${row.id}`)}
        emptyTitle="No guests found"
        emptyDescription="Guests appear here once they make a reservation."
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
