"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BedDouble,
  Bell,
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

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  soon?: boolean;
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Operations",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/admin/reservations", label: "Reservations", icon: CalendarDays },
      { href: "/admin/rooms", label: "Rooms", icon: DoorOpen },
      { href: "/admin/room-types", label: "Room Types", icon: BedDouble },
      { href: "/admin/guests", label: "Guests", icon: Users },
    ],
  },
  {
    title: "Dining & F&B",
    items: [
      { href: "/admin/orders", label: "Orders", icon: ClipboardList },
      { href: "/admin/menu", label: "Menu Catalog", icon: UtensilsCrossed },
      { href: "/table-qr", label: "Table QR Cards", icon: QrCode },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "/admin/staff", label: "Staff & Team", icon: ConciergeBell },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
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

  // Get user initials
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "ST";

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-60 flex-col border-r border-stone-800/90 bg-sidebar shadow-xl">
        {/* Brand Header */}
        <div className="flex h-20 items-center justify-between border-b border-stone-800/80 px-5">
          <HotelLogo
            name={hotelName || "GURJA"}
            subtitle="MANAGEMENT"
            variant="light"
            size="sm"
            layout="left-stacked"
            href="/admin/dashboard"
          />
        </div>

        {/* Navigation Sections */}
        <nav aria-label="Admin navigation" className="flex-1 overflow-y-auto px-3 py-5 no-scrollbar">
          <div className="space-y-6">
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="space-y-1">
                <p className="px-3 text-[10px] font-semibold tracking-widest text-sidebar-muted uppercase">
                  {group.title}
                </p>
                <ul className="mt-1.5 space-y-0.5">
                  {group.items.map((item) => {
                    const active =
                      pathname === item.href ||
                      (item.href !== "/admin/dashboard" && pathname.startsWith(`${item.href}/`));
                    const Icon = item.icon;

                    return (
                      <li key={item.href}>
                        {item.soon ? (
                          <span
                            title="Coming in a later phase"
                            aria-disabled
                            className="flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium text-stone-500"
                          >
                            <Icon aria-hidden className="h-4 w-4 opacity-50" />
                            <span className="flex-1">{item.label}</span>
                            <span className="rounded bg-stone-800 px-1.5 py-0.5 text-[9px] font-medium text-stone-400">
                              Soon
                            </span>
                          </span>
                        ) : (
                          <Link
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "group flex items-center gap-3 rounded-md px-3 py-2 text-xs sm:text-sm font-medium transition-all duration-150",
                              active
                                ? "bg-sidebar-active text-white shadow-xs font-semibold"
                                : "text-sidebar-fg hover:bg-sidebar-hover hover:text-stone-100",
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-5 w-5 items-center justify-center transition-colors",
                                active ? "text-brand" : "text-stone-400 group-hover:text-stone-200",
                              )}
                            >
                              <Icon aria-hidden className="h-4 w-4" />
                            </span>
                            <span className="flex-1 truncate">{item.label}</span>
                            {active ? (
                              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                            ) : null}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* User Card & Sign Out */}
        <div className="border-t border-stone-800/80 p-3 space-y-2 bg-stone-950/40">
          <div className="flex items-center gap-3 px-2 py-1.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-light font-serif text-xs font-bold text-brand-dark">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-stone-200">{user.name}</p>
              <p className="truncate text-[10px] text-stone-400">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-stone-400 transition-colors hover:bg-sidebar-hover hover:text-stone-200 disabled:opacity-50"
          >
            <LogOut aria-hidden className="h-3.5 w-3.5" />
            <span>{signingOut ? "Signing out…" : "Sign out"}</span>
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="ml-60 flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-white/95 backdrop-blur-xs px-6 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-200/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Operations
            </span>
            <span className="text-stone-300">·</span>
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide">
              {hotelName || "Gurja Hotel"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-brand" />
            </button>

            <div className="h-4 w-[1px] bg-stone-200" />

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs sm:text-sm font-semibold text-foreground leading-tight">
                  {user.name}
                </p>
                <p className="text-[10px] text-stone-500 font-medium">
                  {statusMeta(user.role).label}
                </p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-stone-100 border border-stone-200 text-xs font-bold text-stone-700">
                {initials}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}

