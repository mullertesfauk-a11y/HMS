import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { StaffForm } from "@/components/admin/staff/staff-form";
import { requirePermissionPage } from "@/lib/permissions";

export default async function NewStaffPage() {
  await requirePermissionPage("staff.create");

  return (
    <div className="space-y-5">
      <Link
        href="/admin/staff"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" />
        Back to staff
      </Link>
      <div>
        <h1 className="text-xl font-semibold text-foreground">New staff member</h1>
        <p className="mt-0.5 text-sm text-stone-500">
          Create an account for a hotel employee.
        </p>
      </div>
      <StaffForm />
    </div>
  );
}
