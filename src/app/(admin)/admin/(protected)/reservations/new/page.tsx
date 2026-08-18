import Link from "next/link";
import { ArrowLeft, CalendarPlus } from "lucide-react";

import { NewReservationForm } from "@/components/admin/reservations/new-reservation-form";
import { requirePermissionPage } from "@/lib/permissions";
import { hotelService } from "@/server/services/hotel.service";

/**
 * Walk-in booking page. Staff create a reservation on behalf of a guest and
 * must assign a specific physical room up front (front-desk flow). All
 * availability lookups and pricing happen server-side; the form stays a thin
 * caller of the shared reservation/availability services.
 */
export default async function NewReservationPage() {
  await requirePermissionPage("reservations.create");
  const hotel = await hotelService.getDefaultHotel();

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Link
          href="/admin/reservations"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
          Reservations
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
            New Reservation
          </h1>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-light px-2.5 py-1 text-[11px] font-semibold text-brand-dark">
            <CalendarPlus aria-hidden className="h-3 w-3" />
            Walk-in booking
          </span>
        </div>
        <p className="mt-1.5 max-w-2xl text-sm text-slate-500">
          Book a stay on behalf of a guest. A specific room is assigned up front and the
          guest is checked in immediately — collect payment at check-out.
        </p>
      </div>

      <NewReservationForm currency={hotel.currency} timezone={hotel.timezone} />
    </div>
  );
}
