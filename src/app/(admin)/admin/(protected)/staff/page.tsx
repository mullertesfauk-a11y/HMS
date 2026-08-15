import Link from "next/link";

import { StaffTable } from "@/components/admin/staff/staff-table";
import { StaffToolbar, type StaffFilterOptions } from "@/components/admin/staff/staff-toolbar";
import { requirePermissionPage } from "@/lib/permissions";
import { UserRole, UserStatus } from "@/generated/prisma/client";
import { adminStaffListSchema, parseListQuery } from "@/lib/validation/admin";
import { staffService } from "@/server/services/staff.service";

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermissionPage("staff.read");
  const rawParams = await searchParams;

  let query: ReturnType<typeof parseListQuery<typeof adminStaffListSchema>>;
  try {
    query = parseListQuery(adminStaffListSchema, rawParams);
  } catch {
    query = parseListQuery(adminStaffListSchema, {});
  }

  const { items, total } = await staffService.list({
    search: query.search,
    role: query.role as UserRole | undefined,
    status: query.status as UserStatus | undefined,
    page: query.page,
    pageSize: query.pageSize,
  });

  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  const filterOptions: StaffFilterOptions = {
    roles: Object.values(UserRole),
    statuses: Object.values(UserStatus),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Staff</h1>
          <p className="mt-0.5 text-sm text-stone-500">
            Hotel employees and their access. Admin only.
          </p>
        </div>
        <Link
          href="/admin/staff/new"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          New staff member
        </Link>
      </div>

      <StaffToolbar options={filterOptions} />

      <StaffTable
        staff={items.map((member) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          status: member.status,
          lastActivityAt: member.lastActivityAt?.toISOString() ?? null,
          createdAt: member.createdAt.toISOString(),
        }))}
        page={query.page}
        pageSize={query.pageSize}
        total={total}
        totalPages={totalPages}
      />
    </div>
  );
}
