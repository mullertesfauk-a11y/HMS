"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createAppColumnHelper } from "@/components/admin/table-hooks";

import { DataTable, type TableSort } from "@/components/admin/data-table";
import { DataTablePagination } from "@/components/admin/data-table-pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDateFriendly, formatDateTime } from "@/lib/utils/display";

export interface RoomRow {
  id: string;
  roomNumber: string;
  roomTypeName: string;
  floor: number | null;
  status: string;
  reservation: {
    id: string;
    reservationNumber: string;
    checkIn: string;
    checkOut: string;
    guest: { firstName: string; lastName: string };
  } | null;
  updatedAt: string;
}

const columnHelper = createAppColumnHelper<RoomRow>();

export function RoomsTable({
  rooms,
  sort,
  page,
  pageSize,
  total,
  totalPages,
}: {
  rooms: RoomRow[];
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

  const today = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`);

  const columns = [
    columnHelper.accessor("roomNumber", {
      header: "Room",
      enableSorting: true,
      cell: (info) => (
        <span className="font-medium text-foreground">Room {info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("roomTypeName", {
      header: "Room type",
      enableSorting: false,
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("floor", {
      header: "Floor",
      enableSorting: true,
      cell: (info) => (info.getValue() === null ? "—" : String(info.getValue())),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      enableSorting: true,
      cell: (info) => <StatusBadge value={info.getValue()} />,
    }),
    columnHelper.display({
      id: "occupancy",
      header: "Current / next",
      cell: ({ row }) => {
        const reservation = row.original.reservation;
        if (!reservation) return <span className="text-stone-400">—</span>;
        const checkIn = new Date(`${reservation.checkIn}T00:00:00Z`);
        const checkOut = new Date(`${reservation.checkOut}T00:00:00Z`);
        const current = checkIn <= today && today < checkOut;
        return (
          <div className="flex flex-col">
            <span className={current ? "font-medium text-foreground" : "text-stone-600"}>
              {reservation.guest.firstName} {reservation.guest.lastName}
            </span>
            <span className="text-xs text-stone-500">
              {current ? "In house" : "Arriving"} · {formatDateFriendly(reservation.checkIn)} →{" "}
              {formatDateFriendly(reservation.checkOut)}
            </span>
          </div>
        );
      },
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
        data={rooms}
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
        onRowClick={(row) => router.push(`/admin/rooms/${row.id}`)}
        emptyTitle="No rooms found"
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
