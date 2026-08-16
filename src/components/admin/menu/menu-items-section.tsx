"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/admin/status-badge";
import { DataTable, type TableSort } from "@/components/admin/data-table";
import { DataTablePagination } from "@/components/admin/data-table-pagination";
import { createAppColumnHelper } from "@/components/admin/table-hooks";
import { formatMoney } from "@/lib/utils/display";
import { deleteItem } from "@/app/(admin)/admin/(protected)/menu/actions";
import { MenuItemForm } from "@/components/admin/menu/menu-item-form";
import type { MenuItemFormValue } from "@/components/admin/menu/menu-item-form";

export type { MenuItemFormValue };

const columnHelper = createAppColumnHelper<MenuItemFormValue>();

export function MenuItemsSection({
  items,
  categories,
  currency,
  sort,
  page,
  pageSize,
  total,
  totalPages,
}: {
  items: MenuItemFormValue[];
  categories: { id: string; name: string }[];
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
  const [pending, startTransition] = useTransition();

  function navigate(update: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    update(params);
    router.push(`${pathname}?${params.toString()}`);
  }
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItemFormValue | null>(null);
  const [deleting, setDeleting] = useState<MenuItemFormValue | null>(null);
  const [error, setError] = useState<string | null>(null);

  const columns = [
    columnHelper.accessor("name", {
      header: "Item",
      enableSorting: true,
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{info.getValue()}</span>
            <span lang="am" className="text-xs text-stone-500">
              {row.nameAm}
            </span>
          </div>
        );
      },
    }),
    columnHelper.accessor("categoryId", {
      header: "Category",
      enableSorting: false,
      cell: (info) => {
        const category = categories.find((c) => c.id === info.getValue());
        return <span className="text-stone-600">{category?.name ?? "—"}</span>;
      },
    }),
    columnHelper.accessor("price", {
      header: "Price",
      enableSorting: true,
      cell: (info) => (
        <span className="font-medium text-foreground">
          {formatMoney(info.getValue(), currency)}
        </span>
      ),
    }),
    columnHelper.accessor("isAvailable", {
      header: "Status",
      enableSorting: false,
      cell: (info) => (
        <StatusBadge value={info.getValue() ? "ACTIVE" : "INACTIVE"} />
      ),
    }),
    columnHelper.accessor("isFeatured", {
      header: "Featured",
      enableSorting: false,
      cell: (info) =>
        info.getValue() ? (
          <span className="text-xs font-medium text-amber-700">★ Chef&apos;s pick</span>
        ) : (
          <span className="text-stone-300">—</span>
        ),
    }),
    columnHelper.accessor("sortOrder", {
      header: "Sort",
      enableSorting: true,
      cell: (info) => <span className="text-stone-500">{info.getValue()}</span>,
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      enableSorting: false,
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => {
                setEditing(row);
                setError(null);
                setFormOpen(true);
              }}
              aria-label={`Edit ${row.name}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-stone-100 hover:text-foreground"
            >
              <Pencil aria-hidden className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setDeleting(row)}
              aria-label={`Delete ${row.name}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 aria-hidden className="h-4 w-4" />
            </button>
          </div>
        );
      },
    }),
  ];

  function handleDelete() {
    if (!deleting) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteItem(deleting.id);
      if (result.error) {
        setError(result.error);
        setDeleting(null);
        return;
      }
      setDeleting(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Items</h2>
          <p className="mt-0.5 text-sm text-stone-500">
            Dishes and drinks shown on the public menu.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setError(null);
            setFormOpen(true);
          }}
        >
          <Plus aria-hidden className="h-4 w-4" />
          New item
        </Button>
      </div>

      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <DataTable
        columns={columns}
        data={items}
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
        emptyTitle="No menu items found"
        emptyDescription="Try adjusting the search or filters, or create a new item."
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

      {formOpen ? (
        <MenuItemForm
          categories={categories}
          item={editing ?? undefined}
          onClose={() => setFormOpen(false)}
        />
      ) : null}

      <ConfirmationDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title={`Delete ${deleting?.name ?? "item"}?`}
        description="This item will be removed from the public menu. Past orders keep their snapshotted prices. This action cannot be undone."
        confirmLabel="Delete item"
        destructive
        loading={pending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
