import Link from "next/link";
import { Search } from "lucide-react";

import type { PublicHotel } from "@/server/services/hotel.service";
import { HotelLogo } from "@/components/ui/hotel-logo";

/**
 * Public website header: brand mark, primary navigation, and a discreet link
 * to the staff portal.
 */
export function SiteHeader({ hotel }: { hotel: PublicHotel }) {
  const nav = [
    { href: "/", label: "Home" },
    { href: "/rooms", label: "Rooms" },
    { href: "/reservation/lookup", label: "Find my booking" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/95 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-8">
        <HotelLogo
          name={hotel.name || "GURJA"}
          subtitle="HOTEL"
          variant="dark"
          size="md"
          layout="stacked"
          href="/"
        />

        <nav aria-label="Main navigation" className="hidden items-center gap-6 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium uppercase tracking-widest text-stone-600 transition-colors hover:text-brand"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/admin/login"
            className="hidden text-xs font-medium uppercase tracking-widest text-stone-400 transition-colors hover:text-foreground lg:block"
          >
            Staff
          </Link>
          <Link
            href="/rooms"
            className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-sm bg-brand px-6 text-xs font-medium uppercase tracking-widest text-white shadow-sm transition-all duration-300 hover:bg-brand-dark hover:shadow-md"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Find a Room</span>
          </Link>
        </div>
      </div>

      {/* Mobile nav */}
      <nav aria-label="Main navigation (mobile)" className="border-t border-stone-100 bg-white md:hidden">
        <div className="mx-auto flex w-full items-center justify-center gap-4 px-4 py-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-xs font-medium uppercase tracking-widest text-stone-600 transition-colors hover:text-brand"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
