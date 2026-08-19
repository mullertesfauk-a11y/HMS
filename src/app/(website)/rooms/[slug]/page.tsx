import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BedDouble,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  Ruler,
  ShieldCheck,
  Sparkles,
  Users,
  Utensils,
  Wifi,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { BookingPanel } from "@/components/website/booking-panel";
import { AvailabilitySearch } from "@/components/website/availability-search";
import { hotelDateToUtc } from "@/lib/dates";
import { availabilityQuerySchema } from "@/lib/validation/availability";
import { formatMoney } from "@/lib/utils/display";
import { availabilityService } from "@/server/services/availability.service";
import { hotelService } from "@/server/services/hotel.service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const roomType = await hotelService.getRoomTypeBySlug(slug);
    return { title: roomType.name, description: roomType.description ?? undefined };
  } catch {
    return { title: "Room not found" };
  }
}

export default async function RoomTypeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const rawParams = await searchParams;
  const [roomType, hotel] = await Promise.all([
    hotelService.getRoomTypeBySlug(slug).catch(() => null),
    hotelService.getPublicHotel(),
  ]);
  if (!roomType) notFound();

  const t = await getTranslations("rooms");
  const parsed = availabilityQuerySchema.safeParse(rawParams);
  const hasDates = parsed.success;

  // Server-computed pricing for the requested stay (authoritative).
  const availability = hasDates
    ? await availabilityService.searchAvailability({
        hotelId: (await hotelService.getDefaultHotel()).id,
        checkIn: hotelDateToUtc(parsed.data.checkIn)!,
        checkOut: hotelDateToUtc(parsed.data.checkOut)!,
        adults: parsed.data.adults,
        children: parsed.data.children,
        taxRate: hotel.taxRate,
      })
    : null;

  const match = availability?.find((result) => result.slug === slug) ?? null;

  const heroImage =
    roomType.imageUrl ??
    "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2500&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-stone-50/50">
      {/* Breadcrumb & Navigation Bar */}
      <div className="border-b border-stone-200/80 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-8">
          <Link
            href="/rooms"
            className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-600 hover:text-brand transition-colors"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span>{t("backToAll")}</span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 text-xs text-stone-400">
            <span>Rooms</span>
            <span>/</span>
            <span className="font-medium text-stone-800">{roomType.name}</span>
          </div>
        </div>
      </div>

      {/* Hero Showcase Banner */}
      <div className="relative h-[42vh] min-h-[340px] max-h-[500px] w-full overflow-hidden bg-stone-950">
        <img
          src={heroImage}
          alt={roomType.name}
          className="absolute inset-0 h-full w-full object-cover object-center opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />
        
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-10 lg:p-12">
          <div className="mx-auto w-full max-w-7xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-stone-950/60 px-3.5 py-1 backdrop-blur-md">
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-200">
                Gurja Hotel · Exclusive Sanctuary
              </span>
            </div>
            <h1 className="mt-3 font-luxury text-3xl sm:text-5xl lg:text-6xl font-normal uppercase tracking-[0.12em] text-white">
              {roomType.name}
            </h1>
          </div>
        </div>
      </div>

      {/* Main Content Area: 2-Column Desktop Grid */}
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_460px] gap-10 xl:gap-14 items-start">
          
          {/* Left Column: Room Overview, Specs, Amenities & Policies */}
          <div className="space-y-10">
            
            {/* Key Specs Card Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="rounded-xl border border-stone-200 bg-white p-4 text-center shadow-2xs">
                <BedDouble className="mx-auto h-5 w-5 text-brand-brass" />
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-stone-400">Bed Type</p>
                <p className="mt-1 text-sm font-semibold text-stone-800">{roomType.bedType}</p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-4 text-center shadow-2xs">
                <Users className="mx-auto h-5 w-5 text-brand-brass" />
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-stone-400">Capacity</p>
                <p className="mt-1 text-sm font-semibold text-stone-800">
                  {roomType.maxAdults} Adult{roomType.maxAdults !== 1 ? "s" : ""}
                  {roomType.maxChildren > 0 ? `, ${roomType.maxChildren} Child` : ""}
                </p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-4 text-center shadow-2xs">
                <Ruler className="mx-auto h-5 w-5 text-brand-brass" />
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-stone-400">Room Area</p>
                <p className="mt-1 text-sm font-semibold text-stone-800">{roomType.size || "Spacious Layout"}</p>
              </div>

              <div className="rounded-xl border border-stone-200 bg-white p-4 text-center shadow-2xs">
                <Compass className="mx-auto h-5 w-5 text-brand-brass" />
                <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-stone-400">Ambience</p>
                <p className="mt-1 text-sm font-semibold text-stone-800">Garden / Scenic View</p>
              </div>
            </div>

            {/* Room Narrative Description */}
            <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <h2 className="font-display text-2xl font-semibold text-stone-900">
                {t("aboutRoom")}
              </h2>
              <div className="prose prose-stone max-w-none text-sm sm:text-base leading-relaxed text-stone-600">
                <p>
                  {roomType.description ??
                    "Experience unparalleled comfort in our thoughtfully designed room, featuring bespoke furnishings, premium linens, and a tranquil atmosphere perfect for rest and relaxation during your stay at Gurja Hotel."}
                </p>
              </div>
            </div>

            {/* Room Amenities Grid */}
            {roomType.amenities.length > 0 && (
              <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                  <h2 className="font-display text-2xl font-semibold text-stone-900">
                    {t("amenities")}
                  </h2>
                  <span className="text-xs font-medium text-stone-500">
                    {roomType.amenities.length} {t("featuresIncluded")}
                  </span>
                </div>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {roomType.amenities.map((amenity) => (
                    <li
                      key={amenity.name}
                      className="flex items-center gap-3 rounded-lg border border-stone-100 bg-stone-50/70 px-4 py-3 text-sm font-medium text-stone-700"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand-dark">
                        <Check className="h-3 w-3" />
                      </span>
                      <span>{amenity.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Hotel Services & Hospitality Standards */}
            <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <h2 className="font-display text-2xl font-semibold text-stone-900">
                {t("hospitality")}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3.5 rounded-xl bg-stone-50 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-stone-200 text-brand-brass">
                    <Wifi className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-900">Complimentary High-Speed WiFi</p>
                    <p className="mt-0.5 text-xs text-stone-500">Unlimited high-speed internet throughout your entire stay.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 rounded-xl bg-stone-50 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-stone-200 text-brand-brass">
                    <Utensils className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-900">Room Service &amp; Dining</p>
                    <p className="mt-0.5 text-xs text-stone-500">Fresh culinary delights and beverages served straight to your suite.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 rounded-xl bg-stone-50 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-stone-200 text-brand-brass">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-900">Daily Housekeeping</p>
                    <p className="mt-0.5 text-xs text-stone-500">Thorough daily room replenishment with luxury organic amenities.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 rounded-xl bg-stone-50 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-stone-200 text-brand-brass">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-900">24/7 Front Desk Concierge</p>
                    <p className="mt-0.5 text-xs text-stone-500">Dedicated staff ready to assist with excursions, transport and dining.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Check-in & Stay Policies */}
            <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <h2 className="font-display text-2xl font-semibold text-stone-900">
                {t("policies")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-stone-600">
                <div className="flex items-center gap-3 rounded-lg border border-stone-100 p-3.5">
                  <Clock className="h-4 w-4 text-stone-400" />
                  <div>
                    <span className="font-semibold text-stone-900">Check-in Time:</span> From 2:00 PM
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-stone-100 p-3.5">
                  <Clock className="h-4 w-4 text-stone-400" />
                  <div>
                    <span className="font-semibold text-stone-900">Check-out Time:</span> By 11:00 AM
                  </div>
                </div>
              </div>
              <p className="text-xs text-stone-500 pt-1">
                Flexible cancellation up to 24 hours before check-in. Payment settled directly upon arrival at the hotel front desk.
              </p>
            </div>

          </div>

          {/* Right Column: Sticky Booking & Reservation Card */}
          <div className="lg:sticky lg:top-24 space-y-4">
            
            {hasDates && match ? (
              <div className="rounded-2xl border border-stone-200/90 bg-white shadow-xl overflow-hidden">
                <BookingPanel
                  roomTypeSlug={roomType.slug}
                  roomTypeName={roomType.name}
                  checkIn={parsed.data.checkIn}
                  checkOut={parsed.data.checkOut}
                  adults={parsed.data.adults}
                  childCount={parsed.data.children}
                  nights={match.nights}
                  basePrice={match.basePrice}
                  subtotal={match.subtotal}
                  tax={match.tax}
                  total={match.total}
                  currency={hotel.currency}
                />
              </div>
            ) : (
              <div className="rounded-2xl border border-stone-200/90 bg-white p-6 sm:p-8 shadow-xl">
                <div className="border-b border-stone-100 pb-5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400">
                    Direct Best Rate
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight text-stone-900">
                      {formatMoney(roomType.basePrice, hotel.currency)}
                    </span>
                    <span className="text-xs font-medium text-stone-500">/ night</span>
                  </div>
                  <p className="mt-2 text-xs text-stone-500">
                    Taxes included &bull; Instant confirmation &bull; Pay on arrival
                  </p>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-stone-900">
                      Select Your Stay Dates
                    </h3>
                    <p className="mt-0.5 text-xs text-stone-500">
                      {hasDates
                        ? "This room is currently unavailable for the chosen dates. Please try alternative dates."
                        : "Check live rates and secure your reservation."}
                    </p>
                  </div>

                  <AvailabilitySearch
                    variant="inline"
                    targetPath={`/rooms/${roomType.slug}`}
                    initial={
                      hasDates
                        ? {
                            checkIn: parsed.data.checkIn,
                            checkOut: parsed.data.checkOut,
                            adults: parsed.data.adults,
                            children: parsed.data.children,
                          }
                        : undefined
                    }
                  />
                </div>

                <div className="mt-6 rounded-xl bg-stone-50 p-4 text-center border border-stone-100">
                  <p className="text-xs font-medium text-stone-600">
                    Questions about this suite?
                  </p>
                  <p className="text-xs text-brand font-semibold mt-0.5">
                    Contact Front Desk 24/7
                  </p>
                </div>
              </div>
            )}

            {/* Direct Booking Guarantee Card */}
            <div className="rounded-xl border border-stone-200 bg-white p-4.5 shadow-2xs text-xs text-stone-600 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-stone-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Gurja Hotel Direct Guarantee</span>
              </div>
              <ul className="space-y-1 text-[11px] text-stone-500 pl-6 list-disc">
                <li>Best rate guaranteed with no hidden fees</li>
                <li>Complimentary room upgrade when available</li>
                <li>Flexible check-in and priority guest service</li>
              </ul>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

