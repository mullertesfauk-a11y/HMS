"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export interface AvailabilitySearchValues {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
}

/** Local date as YYYY-MM-DD (the widget works with the user's local calendar). */
function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function defaultValues(): AvailabilitySearchValues {
  const today = new Date();
  const checkIn = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const checkOut = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4);
  return {
    checkIn: toDateInputValue(checkIn),
    checkOut: toDateInputValue(checkOut),
    adults: 2,
    children: 0,
  };
}

/**
 * Availability search form. Submits to /rooms with checkIn/checkOut/adults/
 * children query params, where a server component validates and runs the
 * availability engine.
 */
export function AvailabilitySearch({
  initial,
  variant = "card",
  targetPath = "/rooms",
}: {
  initial?: Partial<AvailabilitySearchValues>;
  variant?: "card" | "inline";
  /** Where the search submits (defaults to the rooms listing). */
  targetPath?: string;
}) {
  const router = useRouter();
  const defaults = defaultValues();
  const [checkIn, setCheckIn] = useState(initial?.checkIn ?? defaults.checkIn);
  const [checkOut, setCheckOut] = useState(initial?.checkOut ?? defaults.checkOut);
  const [adults, setAdults] = useState(String(initial?.adults ?? defaults.adults));
  const [children, setChildren] = useState(String(initial?.children ?? defaults.children));

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      adults,
      children,
    });
    router.push(`${targetPath}?${params.toString()}`);
  }

  const isCard = variant === "card";

  return (
    <form
      onSubmit={handleSubmit}
      className={
        isCard
          ? "rounded-xl border border-stone-200/80 bg-white/95 p-5 shadow-2xl shadow-stone-950/10 backdrop-blur-xl ring-1 ring-black/5 sm:p-6 lg:p-7"
          : "flex flex-wrap items-end gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr_auto] lg:items-end">
        <div className={isCard ? "" : "w-44"}>
          <Input
            name="checkIn"
            label="CHECK-IN"
            type="date"
            required
            value={checkIn}
            min={toDateInputValue(new Date())}
            onChange={(event) => setCheckIn(event.target.value)}
            className="border-stone-200 focus:border-brand"
          />
        </div>
        <div className={isCard ? "" : "w-44"}>
          <Input
            name="checkOut"
            label="CHECK-OUT"
            type="date"
            required
            value={checkOut}
            min={checkIn}
            onChange={(event) => setCheckOut(event.target.value)}
            className="border-stone-200 focus:border-brand"
          />
        </div>
        <div className={isCard ? "" : "w-28"}>
          <Select
            name="adults"
            label="ADULTS"
            value={adults}
            onChange={(event) => setAdults(event.target.value)}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "Adult" : "Adults"}
              </option>
            ))}
          </Select>
        </div>
        <div className={isCard ? "" : "w-28"}>
          <Select
            name="children"
            label="CHILDREN"
            value={children}
            onChange={(event) => setChildren(event.target.value)}
          >
            {[0, 1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? "Child" : "Children"}
              </option>
            ))}
          </Select>
        </div>
        <Button
          type="submit"
          size={isCard ? "lg" : "md"}
          className={
            isCard
              ? "h-11 w-full whitespace-nowrap bg-brand px-7 text-xs font-semibold uppercase tracking-widest text-white shadow-md transition-all duration-300 hover:bg-brand-dark hover:shadow-lg lg:w-auto"
              : ""
          }
        >
          <Search aria-hidden className="h-4 w-4 mr-2" />
          <span>Check Rates</span>
        </Button>
      </div>

      {isCard && (
        <div className="mt-4 flex flex-wrap items-center justify-between border-t border-stone-100 pt-3 text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <CalendarDays aria-hidden className="h-3.5 w-3.5 text-brand-brass" />
            <span>Guaranteed best rates &amp; instant confirmation</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-stone-400">
            <span>✦ No booking fees</span>
            <span>✦ Flexible check-in</span>
          </div>
        </div>
      )}
    </form>
  );
}
