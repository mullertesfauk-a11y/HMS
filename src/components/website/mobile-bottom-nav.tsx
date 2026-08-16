"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, ClipboardList, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface MobileBottomNavProps {
  cartCount?: number;
  onOpenOrders?: () => void;
}

export function MobileBottomNav({ cartCount = 0, onOpenOrders }: MobileBottomNavProps) {
  const pathname = usePathname();

  const isHome = pathname === "/";
  const isBrowse = pathname.startsWith("/menu") || pathname.startsWith("/rooms");
  const isProfile = pathname.startsWith("/reservation/lookup") || pathname.startsWith("/admin");

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 block border-t border-stone-200/80 bg-white/95 backdrop-blur-lg md:hidden">
      <nav
        aria-label="Mobile Bottom Navigation"
        className="mx-auto flex max-w-md items-center justify-around px-3 py-2 pb-[max(env(safe-area-inset-bottom),0.65rem)]"
      >
        {/* Home */}
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center gap-1 transition-colors relative py-1 px-3 rounded-full",
            isHome ? "text-brand" : "text-stone-400 hover:text-stone-700",
          )}
        >
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full transition-all",
              isHome ? "bg-brand-light text-brand shadow-sm" : "bg-transparent",
            )}
          >
            <Home className="h-5 w-5" strokeWidth={isHome ? 2.3 : 1.8} />
          </div>
          <span
            className={cn(
              "text-[11px] tracking-tight transition-all",
              isHome ? "font-bold text-brand" : "font-medium text-stone-500",
            )}
          >
            Home
          </span>
        </Link>

        {/* Browse (Menu & Suites) */}
        <Link
          href="/menu"
          className={cn(
            "flex flex-col items-center gap-1 transition-colors relative py-1 px-3 rounded-full",
            isBrowse && !isHome ? "text-brand" : "text-stone-400 hover:text-stone-700",
          )}
        >
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full transition-all",
              isBrowse && !isHome ? "bg-brand-light text-brand shadow-sm" : "bg-transparent",
            )}
          >
            <Compass className="h-5 w-5" strokeWidth={isBrowse && !isHome ? 2.3 : 1.8} />
          </div>
          <span
            className={cn(
              "text-[11px] tracking-tight transition-all",
              isBrowse && !isHome ? "font-bold text-brand" : "font-medium text-stone-500",
            )}
          >
            Browse
          </span>
        </Link>

        {/* Orders (Cart / Active tab) */}
        <button
          type="button"
          onClick={onOpenOrders}
          className="flex flex-col items-center gap-1 text-stone-400 hover:text-stone-700 transition-colors relative py-1 px-3 rounded-full"
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full transition-all">
            <ClipboardList className="h-5 w-5" strokeWidth={1.8} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-brass px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium text-stone-500 tracking-tight">
            Orders
          </span>
        </button>

        {/* Profile / Booking Lookup */}
        <Link
          href="/reservation/lookup"
          className={cn(
            "flex flex-col items-center gap-1 transition-colors relative py-1 px-3 rounded-full",
            isProfile ? "text-brand" : "text-stone-400 hover:text-stone-700",
          )}
        >
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full transition-all",
              isProfile ? "bg-brand-light text-brand shadow-sm" : "bg-transparent",
            )}
          >
            <User className="h-5 w-5" strokeWidth={isProfile ? 2.3 : 1.8} />
          </div>
          <span
            className={cn(
              "text-[11px] tracking-tight transition-all",
              isProfile ? "font-bold text-brand" : "font-medium text-stone-500",
            )}
          >
            Profile
          </span>
        </Link>
      </nav>
    </div>
  );
}
