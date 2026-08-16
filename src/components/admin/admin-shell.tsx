"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BedDouble,
  CalendarDays,
  ClipboardList,
  ConciergeBell,
  DoorOpen,
  LayoutDashboard,
  LogOut,
  QrCode,
  Settings,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils/cn";
import { statusMeta } from "@/lib/domain/labels";
import { HotelLogo } from "@/components/ui/hotel-logo";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Set when the module exists but is not implemented yet. */
  soon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/reservations", label: "Reservations", icon: CalendarDays },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/rooms", label: "Rooms", icon: DoorOpen },
  { href: "/admin/room-types", label: "Room types", icon: BedDouble },
  { href: "/admin/guests", label: "Guests", icon: Users },
  { href: "/admin/staff", label: "Staff", icon: ConciergeBell },
  { href: "/table-qr", label: "Table QR Cards", icon: QrCode },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({
  user,
  hotelName,
  children,
}: {
  user: { name: string; email: string; role: string };
  hotelName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-60 flex-col border-r border-stone-200 bg-white">
        <div className="flex h-20 items-center justify-between border-b border-stone-100 px-5">
          <HotelLogo
            name={hotelName || "GURJA"}
            subtitle="MANAGEMENT"
            variant="dark"
            size="sm"
            layout="left-stacked"
            href="/admin/dashboard"
          />
        </div>

        <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  {item.soon ? (
                    <span
                      title="Coming in a later phase"
                      aria-disabled
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                        "text-stone-400",
                      )}
                    >
                      <Icon aria-hidden className="h-4 w-4" />
                      <span className="flex-1">{item.label}</span>
                      <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-500">
                        Soon
                      </span>
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-brand-light text-brand-dark"
                          : "text-stone-600 hover:bg-stone-100 hover:text-foreground",
                      )}
                    >
                      <Icon aria-hidden className="h-4 w-4" />
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-stone-100 p-3">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-100 hover:text-foreground disabled:opacity-50"
          >
            <LogOut aria-hidden className="h-4 w-4" />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="ml-60 flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-stone-200 bg-white px-6">
          <p className="text-sm text-stone-500">Hotel operations</p>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-stone-500">{user.email}</p>
            </div>
            <span className="rounded-full bg-brand-light px-2.5 py-1 text-xs font-medium text-brand-dark">
              {statusMeta(user.role).label}
            </span>
          </div>
        </header>
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
