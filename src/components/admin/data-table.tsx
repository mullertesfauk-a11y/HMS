"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { flexRender, type ColumnDef, type RowData } from "@tanstack/react-table";

import { EmptyState } from "@/components/admin/empty-state";
import {
  createAppColumnHelper,
  tableFeaturesConfig,
  useAppTable,
} from "@/components/admin/table-hooks";
import { cn } from "@/lib/utils/cn";

export interface TableSort {
  id: string;
  desc: boolean;
}

/**
 * Column def type for the shared features. `any` TValue keeps the generic
 * wrapper compatible with column defs that carry specific value types (v9
 * types the `columns` option as `ColumnDef<F, TData, unknown>`, which is
 * contravariant in the cell/header templates).
 */
type Features = typeof tableFeaturesConfig;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see comment above
type TableColumnDef<TData extends RowData> = ColumnDef<Features, TData, any>;

interface DataTableProps<TData extends RowData> {
  columns: ReadonlyArray<TableColumnDef<TData>>;
  data: TData[];
  getRowId?: (row: TData) => string;
  /** Current server-side sort (from the URL). */
  sort?: TableSort | null;
  onSortChange?: (sort: TableSort | null) => void;
  onRowClick?: (row: TData) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

/**
 * Server-driven data table.
 *
 * Sorting is server-side: clicking a sortable header calls `onSortChange`,
 * which the page uses to update the URL. TanStack Table provides the column
 * definitions, header/cell structure, and row identity.
 */
export function DataTable<TData extends RowData>({
  columns,
  data,
  getRowId,
  sort,
  onSortChange,
  onRowClick,
  emptyTitle = "No results",
  emptyDescription = "No matching records were found.",
}: DataTableProps<TData>) {
  const table = useAppTable<TData>({
    columns: columns as ReadonlyArray<ColumnDef<Features, TData, unknown>>,
    data,
    ...(getRowId ? { getRowId } : {}),
  });

  function handleHeaderClick(columnId: string) {
    if (!onSortChange) return;
    if (!sort || sort.id !== columnId) {
      onSortChange({ id: columnId, desc: false });
    } else if (!sort.desc) {
      onSortChange({ id: columnId, desc: true });
    } else {
      onSortChange(null);
    }
  }

  const rows = table.getRowModel().rows;

  return (
    <div className="overflow-hidden rounded-lg border border-stone-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-stone-200 bg-stone-50">
                {headerGroup.headers.map((header) => {
                  const columnId = header.column.id;
                  const sortable = Boolean(onSortChange) && header.column.getCanSort();
                  const active = sort?.id === columnId;
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-stone-500"
                    >
                      {sortable ? (
                        <button
                          type="button"
                          onClick={() => handleHeaderClick(columnId)}
                          className={cn(
                            "inline-flex items-center gap-1.5 uppercase tracking-wide transition-colors hover:text-foreground",
                            active && "text-brand-dark",
                          )}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {active ? (
                            sort!.desc ? (
                              <ArrowDown aria-hidden className="h-3 w-3" />
                            ) : (
                              <ArrowUp aria-hidden className="h-3 w-3" />
                            )
                          ) : (
                            <ArrowUpDown aria-hidden className="h-3 w-3 opacity-40" />
                          )}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-stone-100">
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                className={cn(
                  "transition-colors",
                  onRowClick && "cursor-pointer hover:bg-stone-50",
                )}
              >
                {row.getAllCells().map((cell) => (
                  <td key={cell.id} className="whitespace-nowrap px-4 py-3 text-stone-700">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : null}
    </div>
  );
}

export { createAppColumnHelper as createColumnHelper };
