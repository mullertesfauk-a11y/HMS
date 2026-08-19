"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarDays, Search } from "lucide-react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("rooms");
  const tCommon = useTranslations("common");
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

  if (!isCard) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Input
            name="checkIn"
            label={t("checkInTime")}
            type="date"
            required
            value={checkIn}
            min={toDateInputValue(new Date())}
            onChange={(event) => setCheckIn(event.target.value)}
            className="w-full text-xs sm:text-sm"
          />
          <Input
            name="checkOut"
            label={t("checkOutTime")}
            type="date"
            required
            value={checkOut}
            min={checkIn}
            onChange={(event) => setCheckOut(event.target.value)}
            className="w-full text-xs sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <Select
            name="adults"
            label="Adults"
            value={adults}
            onChange={(e) => setAdults(e.target.value)}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} {tCommon("adult")}
              </option>
            ))}
          </Select>

          <Select
            name="children"
            label={tCommon("children")}
            value={children}
            onChange={(e) => setChildren(e.target.value)}
          >
            {[0, 1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n} {tCommon("child")}
              </option>
            ))}
          </Select>
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-brand hover:bg-brand-dark text-white font-semibold text-xs uppercase tracking-widest transition-all shadow-sm"
        >
          <Search aria-hidden className="h-4 w-4 mr-2" />
          {t("selectDates")}
        </Button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-stone-200/90 bg-white/95 p-4 sm:p-6 lg:p-7 shadow-2xl shadow-stone-950/15 backdrop-blur-xl ring-1 ring-black/5"
    >
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.2fr_1.2fr_0.8fr_0.8fr_auto] lg:items-end">
        {/* Check-in */}
        <div className="w-full">
          <Input
            name="checkIn"
            label={t("checkInTime")}
            type="date"
            required
            value={checkIn}
            min={toDateInputValue(new Date())}
            onChange={(event) => setCheckIn(event.target.value)}
            className="w-full border-stone-200 focus:border-brand"
          />
        </div>

        {/* Check-out */}
        <div className="w-full">
          <Input
            name="checkOut"
            label={t("checkOutTime")}
            type="date"
            required
            value={checkOut}
            min={checkIn}
            onChange={(event) => setCheckOut(event.target.value)}
            className="w-full border-stone-200 focus:border-brand"
          />
        </div>

        {/* Guest counts */}
        <div className="grid grid-cols-2 gap-3 sm:contents">
          <div className="w-full">
            <Select
              name="adults"
            label={tCommon("adults")}
            value={adults}
            onChange={(e) => setAdults(e.target.value)}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} {tCommon("adult")}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-full">
          <Select
            name="children"
            label={tCommon("children")}
            value={children}
            onChange={(e) => setChildren(e.target.value)}
          >
            {[0, 1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n} {tCommon("child")}
              </option>
            ))}
            </Select>
          </div>
        </div>

        {/* Submit Search Button */}
        <div className="w-full sm:col-span-2 lg:col-span-1 pt-1 sm:pt-0">
          <Button
            type="submit"
            size="lg"
            className="h-11 sm:h-12 w-full whitespace-nowrap bg-brand px-7 text-xs font-semibold uppercase tracking-widest text-white shadow-md transition-all duration-300 hover:bg-brand-dark hover:shadow-lg lg:w-auto"
          >
            <Search aria-hidden className="h-4 w-4 mr-2 shrink-0" />
            <span>{t("selectDates")}</span>
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-stone-100 pt-3 text-[11px] sm:text-xs text-stone-500">
        <div className="flex items-center gap-1.5 text-center sm:text-left">
          <CalendarDays aria-hidden className="h-3.5 w-3.5 text-brand-brass shrink-0" />
          <span>{tCommon("taxesIncluded")} &bull; {tCommon("instantConfirmation")}</span>
        </div>
        <div className="flex items-center gap-3 text-stone-400 text-[10px] sm:text-[11px]">
          <span>✦ {tCommon("payOnArrival")}</span>
          <span>✦ {tCommon("instantConfirmation")}</span>
        </div>
      </div>
    </form>
  );
}
