import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BedDouble, Ruler } from "lucide-react";
import type { Metadata } from "next";

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

  return (
    <>
      {/* Hero Image */}
      <div className="relative h-[50vh] min-h-[400px] w-full bg-stone-900 overflow-hidden">
        <img
          src={
            roomType.imageUrl ??
            "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=2500&auto=format&fit=crop"
          }
          alt={`${roomType.name} hero`}
          className="absolute inset-0 h-full w-full object-cover object-center opacity-60 z-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12">
          <div className="mx-auto max-w-7xl">
            <Link
              href="/rooms"
              className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-stone-300 hover:text-white"
            >
              <ArrowLeft aria-hidden className="h-4 w-4" />
              Back to rooms
            </Link>
            <h1 className="font-display text-5xl text-white md:text-6xl lg:text-7xl">
              {roomType.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
          {/* Details */}
          <div>
            <div className="flex flex-wrap items-center gap-4 border-b border-stone-200 pb-8">
              <span className="inline-flex h-10 items-center justify-center rounded-sm bg-stone-100 px-4 text-sm font-medium uppercase tracking-widest text-stone-600">
                From {formatMoney(roomType.basePrice, hotel.currency)} / night
              </span>
              <div className="flex gap-6 text-sm text-stone-600">
                <span className="inline-flex items-center gap-2">
                  <BedDouble aria-hidden className="h-4 w-4 text-stone-400" />
                  {roomType.bedType}
                </span>
                {roomType.size ? (
                  <span className="inline-flex items-center gap-2">
                    <Ruler aria-hidden className="h-4 w-4 text-stone-400" />
                    {roomType.size}
                  </span>
                ) : null}
                <span>
                  Up to {roomType.maxAdults} Adult{roomType.maxAdults !== 1 ? "s" : ""}
                  {roomType.maxChildren > 0
                    ? ` · ${roomType.maxChildren} Child${roomType.maxChildren !== 1 ? "ren" : ""}`
                    : ""}
                </span>
              </div>
            </div>

            <div className="prose prose-stone mt-8 max-w-none prose-p:leading-relaxed">
              <p className="text-lg text-stone-600">
                {roomType.description ?? "Experience unparalleled comfort in our thoughtfully designed room, featuring bespoke furnishings, premium linens, and a tranquil atmosphere perfect for rest and relaxation."}
              </p>
            </div>

            {roomType.amenities.length > 0 ? (
              <div className="mt-12">
                <h2 className="font-display text-2xl text-foreground">Room Amenities</h2>
                <ul className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
                  {roomType.amenities.map((amenity) => (
                    <li
                      key={amenity.name}
                      className="flex items-center gap-3 text-sm text-stone-600"
                    >
                      <span aria-hidden className="h-px w-4 bg-brand" />
                      {amenity.name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          {/* Booking */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            {hasDates && match ? (
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
            ) : (
              <div className="bg-stone-50 p-8 ring-1 ring-stone-900/5">
                <h3 className="font-display text-2xl text-foreground">Check Availability</h3>
                <p className="mt-2 text-sm text-stone-500">
                  {hasDates
                    ? "This room type is not available for the selected dates and guest count. Try different dates."
                    : "Select your dates to view live pricing and reserve this room."}
                </p>
                <div className="mt-6">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
