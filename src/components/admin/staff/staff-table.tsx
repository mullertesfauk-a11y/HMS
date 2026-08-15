"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Ban, CheckCircle2 } from "lucide-react";
import { createAppColumnHelper } from "@/components/admin/table-hooks";

import { DataTable } from "@/components/admin/data-table";
import { DataTablePagination } from "@/components/admin/data-table-pagination";
import { StatusBadge } from "@/components/admin/status-badge";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { formatDateTime } from "@/lib/utils/display";
import { setStaffStatus, updateStaffRole } from "@/app/(admin)/admin/(protected)/staff/actions";

export interface StaffRow {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastActivityAt: string | null;
  createdAt: string;
}

const columnHelper = createAppColumnHelper<StaffRow>();

export function StaffTable({
  staff,
  page,
  pageSize,
  total,
  totalPages,
}: {
  staff: StaffRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function navigate(update: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    update(params);
    router.push(`${pathname}?${params.toString()}`);
  }

  function run(action: () => Promise<{ ok?: true; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
    });
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
      cell: (info) => info.getValue(),
    }),
    columnHelper.display({
      id: "role",
      header: "Role",
      cell: ({ row }) => {
        const member = row.original;
        return (
          <select
            aria-label={`Role for ${member.name}`}
            value={member.role}
            disabled={pending}
            onChange={(event) => run(() => updateStaffRole(member.id, event.target.value as "ADMIN" | "STAFF"))}
            className="h-8 w-28 rounded-md border border-stone-300 bg-white px-2 text-sm text-foreground focus:border-brand focus:outline-none disabled:opacity-50"
          >
            <option value="ADMIN">Admin</option>
            <option value="STAFF">Staff</option>
          </select>
        );
      },
    }),
    columnHelper.accessor("status", {
      header: "Status",
      enableSorting: false,
      cell: (info) => <StatusBadge value={info.getValue()} />,
    }),
    columnHelper.accessor("lastActivityAt", {
      header: "Last activity",
      enableSorting: false,
      cell: (info) =>
        info.getValue() ? (
          <span className="text-stone-500">{formatDateTime(info.getValue()!)}</span>
        ) : (
          <span className="text-stone-400">Never</span>
        ),
    }),
    columnHelper.accessor("createdAt", {
      header: "Created",
      enableSorting: false,
      cell: (info) => (
        <span className="text-stone-500">{formatDateTime(info.getValue())}</span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const member = row.original;
        if (member.status === "DISABLED") {
          return (
            <button
              type="button"
              onClick={() => run(() => setStaffStatus(member.id, "ACTIVE"))}
              disabled={pending}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
            >
              <CheckCircle2 aria-hidden className="h-4 w-4" />
              Enable
            </button>
          );
        }
        return (
          <ConfirmActionButton
            label="Disable"
            variant="ghost"
            confirmTitle={`Disable ${member.name}?`}
            confirmDescription="They will be signed out and unable to access the admin portal until re-enabled."
            confirmLabel="Disable account"
            icon={<Ban aria-hidden className="h-4 w-4" />}
            action={() => setStaffStatus(member.id, "DISABLED")}
          />
        );
      },
    }),
  ];

  return (
    <div className="space-y-3">
      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <DataTable
        columns={columns}
        data={staff}
        getRowId={(row) => row.id}
        emptyTitle="No staff found"
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
