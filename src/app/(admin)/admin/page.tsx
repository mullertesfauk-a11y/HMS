import { redirect } from "next/navigation";

import { requireAuth } from "@/lib/permissions";

/**
 * /admin — entry point for the admin portal. Authenticated users land on the
 * dashboard; everyone else is sent to the login page.
 */
export default async function AdminIndex() {
  try {
    await requireAuth();
  } catch {
    redirect("/admin/login");
  }
  redirect("/admin/dashboard");
}
