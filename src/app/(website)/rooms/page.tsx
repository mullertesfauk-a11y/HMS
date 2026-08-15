import type { Metadata } from "next";

import { EmptyState } from "@/components/admin/empty-state";
import { AvailabilitySearch } from "@/components/website/availability-search";
import { RoomTypeCard } from "@/components/website/room-type-card";
import { hotelDateToUtc } from "@/lib/dates";
import { availabilityQuerySchema } from "@/lib/validation/availability";
import { formatDateFriendly } from "@/lib/utils/display";
import { availabilityService } from "@/server/services/availability.service";
import { hotelService } from "@/server/services/hotel.service";

export const metadata: Metadata = {
  title: "Rooms & availability",
  description: "Check live availability and prices for your stay.",
};

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const hotel = await hotelService.getPublicHotel();
  const currency = hotel.currency;

  const parsed = availabilityQuerySchema.safeParse(rawParams);
  const hasDates = parsed.success;

  // Availability mode: server-computed pricing for the requested stay.
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

  // Browse mode: all active room types with per-night rates.
  const browse = !hasDates ? await hotelService.getRoomTypes() : null;

  const guestCount = hasDates ? parsed.data.adults + parsed.data.children : 0;
  const heading = hasDates
    ? `${guestCount} guest${guestCount !== 1 ? "s" : ""} · ${formatDateFriendly(
        parsed.data.checkIn,
      )} → ${formatDateFriendly(parsed.data.checkOut)}`
    : "Browse our rooms";

  const subtext = hasDates
    ? "Live availability and prices for your dates, taxes included."
    : "Choose dates above to see real-time availability and stay totals.";

  const hrefQuery = hasDates
    ? {
        checkIn: parsed.data.checkIn,
        checkOut: parsed.data.checkOut,
        adults: String(parsed.data.adults),
        children: String(parsed.data.children),
      }
    : undefined;

  // Curated hotel room photos — one unique image per card.
  const ROOM_IMAGES = [
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?q=80&w=1500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?q=80&w=1500&auto=format&fit=crop",
  ];

  return (
    <div className="bg-surface">
      <div className="bg-stone-950 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-8 text-center">
          <h1 className="font-display text-4xl text-white sm:text-5xl lg:text-6xl">Rooms &amp; Suites</h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-stone-300">
            {hasDates ? "Available rooms for your selected dates." : "Discover the perfect space for your stay."}
          </p>
        </div>
      </div>
      
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-8">
        <div className="mb-12 mt-[-5rem] relative z-10">
          <AvailabilitySearch
            variant="card"
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

        <div>
          <div className="flex items-end justify-between border-b border-stone-200 pb-6">
            <div>
              <h2 className="font-display text-2xl text-foreground">{heading}</h2>
              <p className="mt-1 text-sm text-stone-500">{subtext}</p>
            </div>
          </div>

          {availability && availability.length === 0 ? (
            <div className="mt-12 py-16 text-center">
              <h3 className="font-display text-2xl text-foreground">No rooms available</h3>
              <p className="mt-2 text-stone-500">
                We could not find a room for these dates and guest count. Try different dates or fewer guests.
              </p>
            </div>
          ) : (
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {availability
                ? availability.map((roomType, index) => (
                    <RoomTypeCard
                      key={roomType.slug}
                      slug={roomType.slug}
                      name={roomType.name}
                      description={roomType.description}
                      bedType={roomType.bedType}
                      size={roomType.size}
                      maxAdults={roomType.maxAdults}
                      maxChildren={roomType.maxChildren}
                      basePrice={roomType.basePrice}
                      amenities={roomType.amenities}
                      currency={currency}
                      stayTotal={roomType.total}
                      nights={roomType.nights}
                      availableRooms={roomType.availableRooms}
                      hrefQuery={hrefQuery}
                      imageUrl={ROOM_IMAGES[index % ROOM_IMAGES.length]}
                    />
                  ))
                : browse!.map((roomType, index) => (
                    <RoomTypeCard
                      key={roomType.slug}
                      slug={roomType.slug}
                      name={roomType.name}
                      description={roomType.description}
                      bedType={roomType.bedType}
                      size={roomType.size}
                      maxAdults={roomType.maxAdults}
                      maxChildren={roomType.maxChildren}
                      basePrice={roomType.basePrice}
                      amenities={roomType.amenities}
                      currency={currency}
                      hrefQuery={hrefQuery}
                      imageUrl={ROOM_IMAGES[index % ROOM_IMAGES.length]}
                    />
                  ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
