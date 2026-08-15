import Link from "next/link";
import { ArrowRight, BedDouble, Ruler, Users, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/utils/display";

export interface RoomTypeCardProps {
  slug: string;
  name: string;
  description: string | null;
  bedType: string;
  size: string | null;
  maxAdults: number;
  maxChildren: number;
  basePrice: number;
  amenities: { name: string }[];
  currency: string;
  /** Photo to display at the top of the card. */
  imageUrl?: string;
  /** Server-computed total for a specific stay (availability search). */
  stayTotal?: number;
  nights?: number;
  availableRooms?: number;
  /** Query params carried into the detail page (dates/guests). */
  hrefQuery?: Record<string, string>;
}

/** Public room type card: identity, capacity, price, and a CTA. */
export function RoomTypeCard({
  slug,
  name,
  description,
  bedType,
  size,
  maxAdults,
  maxChildren,
  basePrice,
  amenities,
  currency,
  imageUrl,
  stayTotal,
  nights,
  availableRooms,
  hrefQuery,
}: RoomTypeCardProps) {
  const photo = imageUrl ?? "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?q=80&w=1500&auto=format&fit=crop";
  const query = hrefQuery ? `?${new URLSearchParams(hrefQuery).toString()}` : "";
  const priceLabel = stayTotal !== undefined && nights ? formatMoney(stayTotal, currency) : null;

  return (
    <Card className="group flex flex-col overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-900/5 hover:border-brand-brass/40">
      <Link href={`/rooms/${slug}${query}`} className="relative aspect-[16/11] w-full overflow-hidden bg-stone-100">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
          style={{ backgroundImage: `url('${photo}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        
        {availableRooms !== undefined && availableRooms <= 3 ? (
          <div className="absolute left-4 top-4 z-10">
            <Badge variant={availableRooms === 0 ? "red" : "amber"} className="shadow-md font-medium tracking-wider uppercase text-[10px]">
              {availableRooms === 0 ? "Fully Booked" : `Only ${availableRooms} Available`}
            </Badge>
          </div>
        ) : (
          <div className="absolute right-4 top-4 z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-900/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-amber-200 backdrop-blur-md">
              <Sparkles className="h-3 w-3 text-amber-300" />
              <span>Bespoke</span>
            </span>
          </div>
        )}
      </Link>
      
      <CardContent className="flex flex-1 flex-col p-6 sm:p-7">
        <div className="mb-2">
          <Link href={`/rooms/${slug}${query}`}>
            <h3 className="font-luxury text-xl sm:text-2xl font-semibold tracking-wide text-stone-900 transition-colors group-hover:text-brand">
              {name}
            </h3>
          </Link>
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-stone-500">
          {description ?? "An exquisitely appointed retreat crafted with artisanal details and lavish comfort."}
        </p>

        {/* Room Specs */}
        <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-stone-100 pt-4 text-xs font-medium text-stone-600">
          <span className="inline-flex items-center gap-1.5">
            <BedDouble aria-hidden className="h-3.5 w-3.5 text-brand-brass" />
            {bedType}
          </span>
          {size ? (
            <span className="inline-flex items-center gap-1.5">
              <Ruler aria-hidden className="h-3.5 w-3.5 text-brand-brass" />
              {size}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <Users aria-hidden className="h-3.5 w-3.5 text-brand-brass" />
            <span>
              {maxAdults} Adult{maxAdults !== 1 ? "s" : ""}
              {maxChildren > 0 ? ` · ${maxChildren} Child` : ""}
            </span>
          </span>
        </div>

        {/* Pricing & CTA */}
        <div className="mt-auto pt-6">
          <div className="flex items-end justify-between border-t border-stone-100 pt-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                {priceLabel ? `${nights} Nights Total` : "Per Night From"}
              </p>
              <p className="mt-0.5 font-luxury text-xl font-bold tracking-tight text-stone-900">
                {priceLabel ?? formatMoney(basePrice, currency)}
                {!priceLabel && <span className="ml-1 text-xs font-normal text-stone-500">/ night</span>}
              </p>
            </div>
            <Link
              href={`/rooms/${slug}${query}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-stone-900 px-4 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-brand"
            >
              <span>View Suite</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
