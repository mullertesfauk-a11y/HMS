import Link from "next/link";
import { Search } from "lucide-react";

import type { PublicHotel } from "@/server/services/hotel.service";
import { HotelLogo } from "@/components/ui/hotel-logo";
import { SiteNav } from "@/components/website/site-nav";

/**
 * Public website header: brand mark, primary navigation, and a discreet link
 * to the staff portal.
 */
export function SiteHeader({ hotel }: { hotel: PublicHotel }) {
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

        <SiteNav className="hidden items-center gap-6 md:flex" />

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
        <SiteNav className="mx-auto flex w-full items-center justify-center gap-4 px-4 py-3" />
      </nav>
    </header>
  );
}
