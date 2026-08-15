import { Clock, MapPin, Phone, ShieldCheck, CheckCircle2, BedDouble } from "lucide-react";

import { AvailabilitySearch } from "@/components/website/availability-search";
import { RoomTypeCard } from "@/components/website/room-type-card";
import { hotelService } from "@/server/services/hotel.service";

// Hotel info + room rates come from the live DB — never cache at build time.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [hotel, roomTypes] = await Promise.all([
    hotelService.getPublicHotel(),
    hotelService.getRoomTypes(),
  ]);

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
    <>
      {/* Hero */}
      <section className="relative flex min-h-[85vh] items-center justify-center bg-stone-950 overflow-hidden">
        {/* Background Image */}
        <img
          src="https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2500&auto=format&fit=crop"
          alt="Hotel exterior"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-60 z-0"
        />
        {/* Dark gradient so text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-900/70 to-stone-900/50" />

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-4 text-center sm:px-8 mt-[-4rem]">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-brand-light">
            {hotel.city ? `Welcome to ${hotel.city}` : "Welcome"}
          </p>
          <h1 className="font-display text-5xl text-white sm:text-6xl md:text-7xl lg:text-8xl">
            {hotel.name}
          </h1>
          <p className="mt-8 max-w-2xl text-lg font-light leading-relaxed text-stone-200 sm:text-xl">
            {hotel.description ??
              "Comfortable rooms, attentive service, and a stay you will remember."}
          </p>
        </div>

        {/* Booking Search overlapping the bottom edge */}
        <div className="absolute -bottom-6 left-0 right-0 z-20 px-4 sm:px-8">
          <div className="mx-auto max-w-5xl">
            <AvailabilitySearch variant="card" />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-stone-50 pb-16 pt-24 sm:pt-28">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-8 px-4 text-center sm:gap-16 sm:px-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-brand" />
            <span className="text-sm font-medium uppercase tracking-widest text-stone-600">Best Available Rates</span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-brand" />
            <span className="text-sm font-medium uppercase tracking-widest text-stone-600">Secure Reservation</span>
          </div>
          <div className="flex items-center gap-3">
            <BedDouble className="h-5 w-5 text-brand" />
            <span className="text-sm font-medium uppercase tracking-widest text-stone-600">Flexible Cancellation</span>
          </div>
        </div>
      </section>

      {/* Hotel Introduction (Editorial) */}
      <section className="bg-white py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl gap-16 px-4 sm:px-8 lg:grid-cols-2 lg:items-center">
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-stone-100">
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1500&auto=format&fit=crop')" }}
            />
          </div>
          <div className="max-w-xl lg:pl-12">
            <h2 className="font-display text-4xl text-foreground sm:text-5xl">
              A place to stay and slow down
            </h2>
            <p className="mt-8 text-lg leading-relaxed text-stone-600">
              Experience the perfect blend of modern comfort and timeless hospitality. 
              Our rooms are designed to be your sanctuary in the city, providing a peaceful 
              retreat after a day of exploration or business.
            </p>
            <p className="mt-6 text-lg leading-relaxed text-stone-600">
              From locally sourced amenities to thoughtfully curated interiors, every detail 
              has been considered to make your stay exceptional.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Rooms */}
      <section className="bg-stone-50 py-24 sm:py-32">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
          <div className="text-center">
            <h2 className="font-display text-4xl text-foreground sm:text-5xl">
              Our rooms & suites
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-stone-600">
              Find the perfect space for your stay. Explore live availability and rates.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {roomTypes.map((roomType, index) => (
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
                currency={hotel.currency}
                imageUrl={ROOM_IMAGES[index % ROOM_IMAGES.length]}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Hotel details / Footer Pre-amble */}
      <section className="bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-20 sm:grid-cols-3 sm:px-8">
          <div className="flex gap-4">
            <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand-dark">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-foreground">Location</p>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">
                {[hotel.address, hotel.city, hotel.country].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand-dark">
              <Clock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-foreground">Arrival</p>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">
                Check-in from {hotel.checkInTime}<br/>
                Check-out by {hotel.checkOutTime}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-light text-brand-dark">
              <Phone className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-foreground">Contact</p>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">
                {hotel.phone ?? "Contact the front desk"}<br/>
                {hotel.email}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
