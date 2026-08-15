"use client";

import { createAppColumnHelper } from "@/components/admin/table-hooks";

import { StatusBadge } from "@/components/admin/status-badge";
import { formatDateShort, formatDateTime, formatMoney } from "@/lib/utils/display";

/** Serializable row shape produced server-side for the reservations table. */
export interface ReservationRow {
  id: string;
  reservationNumber: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  roomTypeName: string;
  roomNumber: string | null;
  adults: number;
  children: number;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

const columnHelper = createAppColumnHelper<ReservationRow>();

export function reservationColumns(currency: string) {
  return [
    columnHelper.accessor("reservationNumber", {
      header: "Reservation",
      enableSorting: false,
      cell: (info) => (
        <span className="font-mono text-xs font-medium text-brand-dark">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("guestName", {
      header: "Guest",
      enableSorting: false,
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{info.getValue()}</span>
            <span className="text-xs text-stone-500">{row.guestEmail}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor("checkIn", {
      header: "Check-in",
      enableSorting: true,
      cell: (info) => formatDateShort(info.getValue()),
    }),
    columnHelper.accessor("checkOut", {
      header: "Check-out",
      enableSorting: true,
      cell: (info) => formatDateShort(info.getValue()),
    }),
    columnHelper.accessor("roomTypeName", {
      header: "Room",
      enableSorting: false,
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="flex flex-col">
            <span>{info.getValue()}</span>
            {row.roomNumber ? (
              <span className="text-xs text-stone-500">Room {row.roomNumber}</span>
            ) : (
              <span className="text-xs italic text-stone-400">Unassigned</span>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor("adults", {
      header: "Guests",
      enableSorting: false,
      cell: (info) => {
        const row = info.row.original;
        const parts = [`${row.adults} adult${row.adults === 1 ? "" : "s"}`];
        if (row.children > 0) parts.push(`${row.children} child${row.children === 1 ? "" : "ren"}`);
        return parts.join(", ");
      },
    }),
    columnHelper.accessor("total", {
      header: "Amount",
      enableSorting: true,
      cell: (info) => (
        <span className="font-medium text-foreground">
          {formatMoney(info.getValue(), currency)}
        </span>
      ),
    }),
    columnHelper.accessor("paymentStatus", {
      header: "Payment",
      enableSorting: false,
      cell: (info) => <StatusBadge value={info.getValue()} />,
    }),
    columnHelper.accessor("status", {
      header: "Status",
      enableSorting: true,
      cell: (info) => <StatusBadge value={info.getValue()} />,
    }),
    columnHelper.accessor("createdAt", {
      header: "Created",
      enableSorting: true,
      cell: (info) => (
        <span className="text-stone-500">{formatDateTime(info.getValue())}</span>
      ),
    }),
  ];
}
