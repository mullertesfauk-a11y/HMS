import Link from "next/link";
import { ArrowRight, BedDouble, Ruler } from "lucide-react";

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
    <Card className="group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-md">
      <Link href={`/rooms/${slug}${query}`} className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url('${photo}')` }}
        />
        {availableRooms !== undefined && availableRooms <= 3 ? (
          <div className="absolute left-4 top-4 z-10">
            <Badge variant={availableRooms === 0 ? "red" : "amber"} className="shadow-sm">
              {availableRooms === 0 ? "Fully booked" : `Only ${availableRooms} left`}
            </Badge>
          </div>
        ) : null}
      </Link>
      <CardContent className="flex flex-1 flex-col p-6">
        <div className="mb-2 flex items-center justify-between">
          <Link href={`/rooms/${slug}${query}`}>
            <h3 className="font-display text-2xl text-foreground transition-colors group-hover:text-brand">{name}</h3>
          </Link>
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-stone-500">
          {description ?? "A comfortable room for your stay."}
        </p>

        <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-stone-600">
          <span className="inline-flex items-center gap-1.5">
            <BedDouble aria-hidden className="h-4 w-4 text-stone-400" />
            {bedType}
          </span>
          {size ? (
            <span className="inline-flex items-center gap-1.5">
              <Ruler aria-hidden className="h-4 w-4 text-stone-400" />
              {size}
            </span>
          ) : null}
          <span>
            {maxAdults} Adult{maxAdults !== 1 ? "s" : ""}
            {maxChildren > 0 ? ` · ${maxChildren} Child${maxChildren !== 1 ? "ren" : ""}` : ""}
          </span>
        </div>

        <div className="mt-auto pt-8">
          <div className="flex items-end justify-between border-t border-stone-100 pt-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-stone-400">
                {priceLabel ? "Stay total" : "Starting from"}
              </p>
              <p className="mt-1 font-display text-xl text-foreground">
                {priceLabel ?? formatMoney(basePrice, currency)}
              </p>
              <p className="text-xs text-stone-500">
                {priceLabel ? `${nights} night${nights !== 1 ? "s" : ""}, taxes included` : "per night, plus taxes"}
              </p>
            </div>
            <Link
              href={`/rooms/${slug}${query}`}
              className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-sm bg-stone-900 px-5 text-xs font-medium uppercase tracking-widest text-white transition-colors hover:bg-brand"
            >
              View Room
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
