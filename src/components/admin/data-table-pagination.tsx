"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export function DataTablePagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border bg-white shadow-xs">
      <p className="text-xs sm:text-sm font-medium text-stone-500" aria-live="polite">
        Showing <span className="text-stone-800 font-semibold">{from}–{to}</span> of{" "}
        <span className="text-stone-800 font-semibold">{total}</span> {total === 1 ? "result" : "results"}
      </p>

      <div className="flex items-center gap-3">
        {onPageSizeChange ? (
          <div className="flex items-center gap-2">
            <label htmlFor="page-size" className="text-xs font-medium text-stone-500">
              Rows
            </label>
            <Select
              id="page-size"
              value={String(pageSize)}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="h-8 w-[72px] py-0 text-xs font-medium"
              aria-label="Rows per page"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        <div className="flex items-center gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
            className="h-8 w-8 p-0"
          >
            <ChevronLeft aria-hidden className="h-4 w-4" />
          </Button>
          <span className="px-2 text-xs font-medium text-stone-600">
            Page {page} of {Math.max(totalPages, 1)}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
            className="h-8 w-8 p-0"
          >
            <ChevronRight aria-hidden className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

