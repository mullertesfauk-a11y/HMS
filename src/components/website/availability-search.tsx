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
          ? "grid gap-3 rounded-md bg-white p-4 shadow-xl shadow-black/5 ring-1 ring-stone-900/5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_0.7fr_0.7fr_auto] lg:items-end lg:p-6 lg:gap-4"
          : "flex flex-wrap items-end gap-3 rounded-md bg-white p-4 shadow-sm ring-1 ring-stone-900/5"
      }
    >
      <div className={isCard ? "" : "w-44"}>
        <Input
          name="checkIn"
          label="Check-in"
          type="date"
          required
          value={checkIn}
          min={toDateInputValue(new Date())}
          onChange={(event) => setCheckIn(event.target.value)}
        />
      </div>
      <div className={isCard ? "" : "w-44"}>
        <Input
          name="checkOut"
          label="Check-out"
          type="date"
          required
          value={checkOut}
          min={checkIn}
          onChange={(event) => setCheckOut(event.target.value)}
        />
      </div>
      <div className={isCard ? "" : "w-24"}>
        <Select
          name="adults"
          label="Adults"
          value={adults}
          onChange={(event) => setAdults(event.target.value)}
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>
      </div>
      <div className={isCard ? "" : "w-24"}>
        <Select
          name="children"
          label="Children"
          value={children}
          onChange={(event) => setChildren(event.target.value)}
        >
          {[0, 1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" size={isCard ? "lg" : "md"} className={isCard ? "w-full lg:w-auto lg:h-11" : ""}>
        <Search aria-hidden className="h-4 w-4" />
        <span className="hidden sm:inline">Search</span>
      </Button>

      {isCard && (
        <p className="col-span-full flex items-center justify-center lg:justify-start gap-1.5 text-xs text-stone-500 pt-2 lg:pt-0">
          <CalendarDays aria-hidden className="h-3.5 w-3.5" />
          Real-time availability and prices, updated as you search.
        </p>
      )}
    </form>
  );
}
