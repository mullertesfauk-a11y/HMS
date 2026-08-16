"use client";

import { createAppColumnHelper } from "@/components/admin/table-hooks";

import { StatusBadge } from "@/components/admin/status-badge";
import { formatDateTime, formatMoney } from "@/lib/utils/display";

/** Serializable row shape produced server-side for the orders table. */
export interface OrderRow {
  id: string;
  orderNumber: string;
  guestName: string;
  guestPhone: string;
  itemCount: number;
  total: number;
  status: string;
  createdAt: string;
}

const columnHelper = createAppColumnHelper<OrderRow>();

export function orderColumns(currency: string) {
  return [
    columnHelper.accessor("orderNumber", {
      header: "Order",
      enableSorting: false,
      cell: (info) => (
        <span className="font-mono text-xs font-medium text-brand-dark">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("guestName", {
      header: "Guest",
      enableSorting: true,
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{info.getValue()}</span>
            <span className="text-xs text-stone-500">{row.guestPhone}</span>
          </div>
        );
      },
    }),
    columnHelper.accessor("itemCount", {
      header: "Items",
      enableSorting: false,
      cell: (info) => (
        <span className="text-stone-700">
          {info.getValue()} {info.getValue() === 1 ? "item" : "items"}
        </span>
      ),
    }),
    columnHelper.accessor("total", {
      header: "Total",
      enableSorting: true,
      cell: (info) => (
        <span className="font-medium text-foreground">
          {formatMoney(info.getValue(), currency)}
        </span>
      ),
    }),
    columnHelper.accessor("status", {
      header: "Status",
      enableSorting: true,
      cell: (info) => <StatusBadge value={info.getValue()} />,
    }),
    columnHelper.accessor("createdAt", {
      header: "Placed",
      enableSorting: true,
      cell: (info) => (
        <span className="text-stone-500">{formatDateTime(info.getValue())}</span>
      ),
    }),
  ];
}
