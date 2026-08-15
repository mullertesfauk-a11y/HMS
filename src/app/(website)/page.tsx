import Link from "next/link";
import {
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  BedDouble,
  Sparkles,
  ArrowRight,
  Compass,
} from "lucide-react";

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
      {/* Grand Luxury Hero Section */}
      <section className="relative flex min-h-[92vh] items-center justify-center bg-stone-950 overflow-hidden pb-32 sm:pb-36 pt-16">
        {/* Cinematic Backdrop Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2600&auto=format&fit=crop"
            alt="Gurja Hotel Sanctuary"
            className="h-full w-full object-cover object-center brightness-[0.62] contrast-[1.05] transition-transform duration-10000 hover:scale-105"
          />
          {/* Multi-layered Vignette & Atmospheric Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-stone-950/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-stone-950/80" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center px-4 text-center sm:px-8">
          {/* Prestige Accolade Pill */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-amber-300/30 bg-stone-900/70 px-4 py-1.5 backdrop-blur-md shadow-lg shadow-black/40 animate-fade-in">
            <span className="flex h-2 w-2 items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
            </span>
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">
              {hotel.city ? `${hotel.city} · ` : ""}Luxury Hotel &amp; Suites
            </span>
          </div>

          {/* Stately Brand Title */}
          <h1
            className="mt-6 font-luxury text-4xl font-normal uppercase tracking-[0.2em] text-white sm:text-6xl md:text-7xl lg:text-8xl drop-shadow-md select-none"
            style={{ marginRight: "-0.2em" }}
          >
            {hotel.name || "GURJA HOTEL"}
          </h1>

          {/* Luxury Subtitle Lockup */}
          <div className="mt-3 flex items-center justify-center gap-3">
            <span className="hidden sm:block h-[1px] w-8 sm:w-12 bg-amber-300/50" />
            <p className="text-xs sm:text-sm font-sans font-semibold uppercase tracking-[0.38em] text-amber-300/90">
              An Enclave of Refined Hospitality
            </p>
            <span className="hidden sm:block h-[1px] w-8 sm:w-12 bg-amber-300/50" />
          </div>

          {/* Editorial Hook */}
          <p className="mt-6 max-w-2xl text-base sm:text-lg font-light leading-relaxed text-stone-200/90 sm:leading-loose">
            {hotel.description ??
              "Immerse yourself in a serene architectural sanctuary where bespoke suites, world-class dining, and timeless Ethiopian warmth converge."}
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/rooms"
              className="inline-flex h-12 items-center justify-center gap-2.5 rounded-sm bg-brand px-7 text-xs font-semibold uppercase tracking-widest text-white shadow-xl shadow-brand/20 transition-all duration-300 hover:bg-brand-dark hover:shadow-2xl"
            >
              <span>Explore Suites</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/reservation/lookup"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-sm border border-stone-200/30 bg-white/10 px-6 text-xs font-semibold uppercase tracking-widest text-stone-100 backdrop-blur-md transition-all duration-300 hover:bg-white/20 hover:text-white"
            >
              <span>Find My Booking</span>
            </Link>
          </div>
        </div>

        {/* Floating Concierge Booking Search Console */}
        <div className="absolute -bottom-8 left-0 right-0 z-20 px-4 sm:px-8">
          <div className="mx-auto max-w-5xl">
            <AvailabilitySearch variant="card" />
          </div>
        </div>
      </section>

      {/* Prestige Trust Bar */}
      <section className="border-b border-stone-200/60 bg-stone-50 pb-16 pt-24 sm:pt-28">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-8 px-4 text-center sm:gap-16 sm:px-8">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-brand" />
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-stone-700">
              Guaranteed Best Rates Direct
            </span>
          </div>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-brand" />
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-stone-700">
              24/7 Dedicated Concierge
            </span>
          </div>
          <div className="flex items-center gap-3">
            <BedDouble className="h-5 w-5 text-brand" />
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-stone-700">
              Flexible Cancellation
            </span>
          </div>
        </div>
      </section>

      {/* Hotel Introduction / The Gurja Philosophy */}
      <section className="relative overflow-hidden bg-white py-24 sm:py-32">
        <div className="mx-auto grid max-w-7xl gap-16 px-4 sm:px-8 lg:grid-cols-12 lg:items-center">
          {/* Editorial Visual Composition */}
          <div className="relative lg:col-span-6">
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-stone-100 shadow-2xl shadow-stone-900/10">
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1500&auto=format&fit=crop')",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 via-transparent to-transparent" />
            </div>

            {/* Floating Luxury Quote Card */}
            <div className="absolute -bottom-6 -right-4 max-w-xs rounded-xl border border-stone-200/80 bg-white/95 p-6 shadow-xl backdrop-blur-md hidden sm:block">
              <span className="text-amber-500 text-lg">✦</span>
              <p className="mt-2 font-display text-sm italic leading-snug text-stone-800">
                &ldquo;A sanctuary where ancient Ethiopian heritage meets contemporary architectural poetry.&rdquo;
              </p>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-brand-brass">
                Shire, Tigray Sanctuary
              </p>
            </div>
          </div>

          {/* Editorial Narrative */}
          <div className="max-w-xl lg:col-span-6 lg:pl-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-light px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand">
              <span>The Gurja Philosophy</span>
            </div>

            <h2 className="mt-6 font-luxury text-3xl font-normal uppercase tracking-[0.14em] text-stone-900 sm:text-4xl lg:text-5xl leading-tight">
              A Sanctuary Sculpted for the Senses
            </h2>

            <p className="mt-6 text-base leading-relaxed text-stone-600 sm:text-lg">
              Conceived as a tranquil haven in the heart of Shire, Tigray, Gurja Hotel merges refined
              architectural restraint with the soulful warmth of authentic Ethiopian hospitality.
            </p>

            <p className="mt-4 text-base leading-relaxed text-stone-600">
              Every curve, surface, and fabric has been selected with uncompromising attention to detail — from
              hand-finished local brass fixtures and stone masonry to customized organic cotton linens.
            </p>

            {/* Core Pillars */}
            <div className="mt-8 grid grid-cols-2 gap-6 border-t border-stone-200 pt-8">
              <div>
                <p className="font-luxury text-2xl font-semibold text-stone-900">100%</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-widest text-stone-500">
                  Organic Ethiopian Cottons
                </p>
              </div>
              <div>
                <p className="font-luxury text-2xl font-semibold text-stone-900">24 / 7</p>
                <p className="mt-1 text-xs font-medium uppercase tracking-widest text-stone-500">
                  Dedicated Butler Service
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Suites & Accommodations */}
      <section className="bg-stone-50/80 py-24 sm:py-32 border-y border-stone-200/60">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-stone-200/70 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700">
              <span>Accommodations</span>
            </div>
            <h2 className="mt-4 font-luxury text-3xl font-normal uppercase tracking-[0.16em] text-stone-900 sm:text-4xl lg:text-5xl">
              Curated Suites &amp; Rooms
            </h2>
            <div className="mt-3 flex items-center justify-center gap-3">
              <span className="h-[1px] w-6 sm:w-10 bg-brand-brass/60" />
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-brand-brass">
                Bespoke Sanctuaries of Rest
              </p>
              <span className="h-[1px] w-6 sm:w-10 bg-brand-brass/60" />
            </div>
            <p className="mx-auto mt-4 max-w-2xl text-base text-stone-600">
              Indulge in private spaces tailored for restful slumber, featuring mountain and city vistas and intuitive
              modern amenities.
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

          <div className="mt-12 text-center">
            <Link
              href="/rooms"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-brand hover:text-brand-dark transition-colors border-b border-brand pb-1"
            >
              <span>Explore All Suites &amp; Rates</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Hotel Concierge, Location & Details */}
      <section className="bg-white py-20">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 sm:grid-cols-3 sm:px-8">
          {/* Card 1 */}
          <div className="flex gap-4 rounded-xl border border-stone-200/60 bg-stone-50/50 p-6 shadow-sm">
            <span
              aria-hidden
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand"
            >
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-brass">Prime Location</p>
              <h4 className="mt-1 font-luxury text-lg font-semibold text-stone-900">Shire, Tigray</h4>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                {[hotel.address, hotel.city, hotel.country].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="flex gap-4 rounded-xl border border-stone-200/60 bg-stone-50/50 p-6 shadow-sm">
            <span
              aria-hidden
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand"
            >
              <Clock className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-brass">Timings</p>
              <h4 className="mt-1 font-luxury text-lg font-semibold text-stone-900">Arrival &amp; Departure</h4>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                Check-in from {hotel.checkInTime}
                <br />
                Check-out by {hotel.checkOutTime}
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex gap-4 rounded-xl border border-stone-200/60 bg-stone-50/50 p-6 shadow-sm">
            <span
              aria-hidden
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-light text-brand"
            >
              <Phone className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-brass">Concierge Care</p>
              <h4 className="mt-1 font-luxury text-lg font-semibold text-stone-900">Direct Inquiries</h4>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                {hotel.phone ?? "24/7 Front Desk Concierge"}
                <br />
                {hotel.email}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
