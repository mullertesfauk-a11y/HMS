import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { requireAuth } from "@/lib/permissions";
import { hotelService } from "@/server/services/hotel.service";

/**
 * Gate for all protected /admin/* routes (everything except /admin/login).
 *
 * Server-side auth check (never trust client state), then render the shared
 * shell: sidebar navigation + topbar with the signed-in user.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user: Awaited<ReturnType<typeof requireAuth>>;
  try {
    user = await requireAuth();
  } catch {
    redirect("/admin/login");
  }

  const hotel = await hotelService.getDefaultHotel();

  return (
    <AdminShell user={{ name: user.name, email: user.email, role: user.role }} hotelName={hotel.name}>
      {children}
    </AdminShell>
  );
}
