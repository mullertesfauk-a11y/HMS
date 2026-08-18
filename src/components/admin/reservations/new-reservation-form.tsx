"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  BedDouble,
  CalendarDays,
  Check,
  DoorOpen,
  Moon,
  Search,
  Users,
  Wallet,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";
import { formatDateFriendly, formatMoney } from "@/lib/utils/display";
import {
  createAdminReservation,
  listFreeRooms,
  searchAdminAvailability,
} from "@/app/(admin)/admin/(protected)/reservations/actions";
import type { AvailableRoomType } from "@/server/services/availability.service";

/** Today's date in the hotel's timezone, as YYYY-MM-DD. */
function todayInTimezone(timezone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(`${checkIn}T00:00:00Z`).getTime();
  const b = new Date(`${checkOut}T00:00:00Z`).getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

interface FreeRoom {
  id: string;
  roomNumber: string;
  floor: number | null;
}

const STEPS = [
  { label: "Stay", icon: CalendarDays },
  { label: "Room", icon: DoorOpen },
  { label: "Guest", icon: Users },
] as const;

/**
 * Admin walk-in booking form.
 *
 * Checkout-style layout: a guided 3-step flow on the left (Stay → Room →
 * Guest) with a sticky live summary + confirm CTA on the right. Every lookup
 * goes through server actions backed by the shared availability and
 * reservation services — the client never computes prices.
 */
export function NewReservationForm({
  currency,
  timezone,
}: {
  currency: string;
  timezone: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Step 1 — stay (walk-ins arrive today)
  const [checkIn, setCheckIn] = useState(() => todayInTimezone(timezone));
  const [checkOut, setCheckOut] = useState(() => addDays(todayInTimezone(timezone), 3));
  const [adults, setAdults] = useState("2");
  const [children, setChildren] = useState("0");
  // Walk-in guests are present — the stay starts CHECKED_IN by default.
  const [checkInNow, setCheckInNow] = useState(true);

  // Step 2 — room type (null = not searched yet)
  const [roomTypes, setRoomTypes] = useState<AvailableRoomType[] | null>(null);
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string | null>(null);

  // Step 3 — physical room
  const [freeRooms, setFreeRooms] = useState<FreeRoom[] | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Step 4 — guest
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  const nights = nightsBetween(checkIn, checkOut);
  const selectedType = roomTypes?.find((roomType) => roomType.id === selectedRoomTypeId) ?? null;
  const selectedRoom = freeRooms?.find((room) => room.id === selectedRoomId) ?? null;
  const canSubmit = Boolean(selectedRoomId && firstName.trim() && lastName.trim() && email.trim());

  /** Any change to the stay invalidates the availability results below it. */
  function changeStay(setter: (value: string) => void) {
    return (value: string) => {
      setter(value);
      setError(null);
      setRoomTypes(null);
      setFreeRooms(null);
      setSelectedRoomTypeId(null);
      setSelectedRoomId(null);
    };
  }

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setRoomTypes(null);
    setFreeRooms(null);
    setSelectedRoomTypeId(null);
    setSelectedRoomId(null);
    startTransition(async () => {
      const result = await searchAdminAvailability({
        checkIn,
        checkOut,
        adults: Number(adults),
        children: Number(children),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setRoomTypes(result.results);
    });
  }

  async function handleRoomTypeSelect(roomTypeId: string) {
    setSelectedRoomTypeId(roomTypeId);
    setSelectedRoomId(null);
    setFreeRooms(null);
    setError(null);
    setLoadingRooms(true);
    try {
      const result = await listFreeRooms({ roomTypeId, checkIn, checkOut });
      if (!result.ok) {
        setError(result.error);
        setFreeRooms([]);
        return;
      }
      setFreeRooms(result.rooms);
    } catch {
      setError("Could not load available rooms");
      setFreeRooms([]);
    } finally {
      setLoadingRooms(false);
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const selectedTypeForSubmit = roomTypes?.find(
      (roomType) => roomType.id === selectedRoomTypeId,
    );
    if (!selectedTypeForSubmit) {
      setError("Search availability and select a room type first");
      return;
    }
    if (!selectedRoomId) {
      setError("Select an available room for the stay");
      return;
    }
    startTransition(async () => {
      const result = await createAdminReservation({
        checkIn,
        checkOut,
        adults: Number(adults),
        children: Number(children),
        roomTypeSlug: selectedTypeForSubmit.slug,
        roomId: selectedRoomId,
        checkInNow,
        guest: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          country: country.trim() || undefined,
        },
        specialRequests: specialRequests.trim() || undefined,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/admin/reservations/${result.reservationId}`);
      router.refresh();
    });
  }

  // Stepper state: 0 = Stay, 1 = Room, 2 = Guest
  const stepState = (index: number): "done" | "current" | "upcoming" => {
    if (index === 0) return roomTypes !== null ? "done" : "current";
    if (index === 1) return selectedRoomId ? "done" : roomTypes !== null ? "current" : "upcoming";
    return selectedRoomId ? "current" : "upcoming";
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      {/* ── Left column: stepper + steps ─────────────────────────────── */}
      <div className="min-w-0 space-y-5">
        {/* Stepper */}
        <ol className="flex items-center gap-2" aria-label="Booking steps">
          {STEPS.map((step, index) => {
            const state = stepState(index);
            const Icon = step.icon;
            return (
              <li key={step.label} className="flex flex-1 items-center gap-2 last:flex-none">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors",
                      state === "done" && "border-brand bg-brand text-white",
                      state === "current" && "border-brand bg-brand-light text-brand-dark",
                      state === "upcoming" && "border-slate-200 bg-white text-slate-400",
                    )}
                  >
                    {state === "done" ? (
                      <Check aria-hidden className="h-3.5 w-3.5" />
                    ) : (
                      <Icon aria-hidden className="h-3 w-3" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium whitespace-nowrap",
                      state === "upcoming" ? "text-slate-400" : "text-slate-700",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 ? (
                  <span
                    aria-hidden
                    className={cn(
                      "h-px flex-1",
                      state === "done" ? "bg-brand/50" : "bg-slate-200",
                    )}
                  />
                ) : null}
              </li>
            );
          })}
        </ol>

        {/* Step 1 — Stay */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-light text-[10px] font-bold text-brand-dark">
                1
              </span>
              Stay details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  name="checkIn"
                  label="Check-in"
                  type="date"
                  required
                  value={checkIn}
                  min={todayInTimezone(timezone)}
                  onChange={(event) => changeStay(setCheckIn)(event.target.value)}
                />
                <Input
                  name="checkOut"
                  label="Check-out"
                  type="date"
                  required
                  value={checkOut}
                  min={checkIn}
                  onChange={(event) => changeStay(setCheckOut)(event.target.value)}
                />
              </div>
              <div className="flex items-center justify-between rounded-md bg-surface-subtle px-3.5 py-2.5 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5 font-medium">
                  <Moon aria-hidden className="h-3.5 w-3.5 text-brand-brass" />
                  {nights} night{nights === 1 ? "" : "s"}
                </span>
                <span>
                  {formatDateFriendly(checkIn)} → {formatDateFriendly(checkOut)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  name="adults"
                  label="Adults"
                  value={adults}
                  onChange={(event) => changeStay(setAdults)(event.target.value)}
                >
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "Adult" : "Adults"}
                    </option>
                  ))}
                </Select>
                <Select
                  name="children"
                  label="Children"
                  value={children}
                  onChange={(event) => changeStay(setChildren)(event.target.value)}
                >
                  {[0, 1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "Child" : "Children"}
                    </option>
                  ))}
                </Select>
              </div>
              <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border bg-surface-subtle/50 px-3.5 py-3">
                <input
                  type="checkbox"
                  checked={checkInNow}
                  onChange={(event) => setCheckInNow(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-[var(--brand)]"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-800">
                    Check in immediately
                  </span>
                  <span className="block text-xs text-slate-500">
                    Guest is present — the stay starts as Checked in. Uncheck for advance desk
                    bookings.
                  </span>
                </span>
              </label>
              <Button type="submit" loading={pending} className="w-full sm:w-auto">
                <Search aria-hidden className="h-4 w-4" />
                Check availability &amp; rates
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Step 2 — Room type */}
        {roomTypes !== null ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-light text-[10px] font-bold text-brand-dark">
                  2
                </span>
                Choose a room type
                <span className="ml-auto text-xs font-normal text-slate-400">
                  {roomTypes.length} option{roomTypes.length === 1 ? "" : "s"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {roomTypes.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-surface-subtle/50 px-4 py-8 text-center">
                  <BedDouble aria-hidden className="mx-auto h-6 w-6 text-slate-300" />
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    No room types available
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Nothing is bookable for these dates and guest count. Try adjusting the stay.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Room type">
                  {roomTypes.map((roomType) => {
                    const checked = roomType.id === selectedRoomTypeId;
                    return (
                      <label
                        key={roomType.id}
                        className={cn(
                          "relative flex cursor-pointer flex-col justify-between gap-3 rounded-lg border bg-white p-4 transition-all",
                          checked
                            ? "border-brand ring-1 ring-brand/40 bg-brand-light/30"
                            : "border-border hover:border-slate-300 hover:shadow-sm",
                        )}
                      >
                        <input
                          type="radio"
                          name="roomType"
                          value={roomType.id}
                          checked={checked}
                          onChange={() => handleRoomTypeSelect(roomType.id)}
                          className="sr-only"
                        />
                        {checked ? (
                          <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white">
                            <Check aria-hidden className="h-3 w-3" />
                          </span>
                        ) : null}
                        <div className="pr-6">
                          <p className="text-sm font-semibold text-foreground">{roomType.name}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {roomType.bedType}
                            {roomType.size ? ` · ${roomType.size} m²` : ""}
                          </p>
                        </div>
                        <div className="flex items-end justify-between">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                              roomType.availableRooms > 2
                                ? "bg-emerald-50 text-emerald-700"
                                : roomType.availableRooms > 0
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-red-50 text-red-600",
                            )}
                          >
                            {roomType.availableRooms} left
                          </span>
                          <div className="text-right">
                            <p className="text-sm font-bold text-foreground">
                              {formatMoney(roomType.basePrice, currency)}
                              <span className="text-[11px] font-normal text-slate-400"> / night</span>
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {formatMoney(roomType.total, currency)} · {roomType.nights} night
                              {roomType.nights === 1 ? "" : "s"}
                            </p>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {/* Step 3 — Room */}
        {selectedRoomTypeId ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-light text-[10px] font-bold text-brand-dark">
                  3
                </span>
                Assign a room
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRooms ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
                  ))}
                </div>
              ) : freeRooms === null ? (
                <p className="text-sm text-slate-500">Select a room type above to see free rooms.</p>
              ) : freeRooms.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-surface-subtle/50 px-4 py-8 text-center">
                  <DoorOpen aria-hidden className="mx-auto h-6 w-6 text-slate-300" />
                  <p className="mt-2 text-sm font-medium text-slate-600">No rooms free</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Every room of this type is booked for the selected stay.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Room">
                  {freeRooms.map((room) => {
                    const checked = room.id === selectedRoomId;
                    return (
                      <label
                        key={room.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border bg-white px-4 py-3 transition-all",
                          checked
                            ? "border-brand ring-1 ring-brand/40 bg-brand-light/30"
                            : "border-border hover:border-slate-300 hover:shadow-sm",
                        )}
                      >
                        <input
                          type="radio"
                          name="room"
                          value={room.id}
                          checked={checked}
                          onChange={() => setSelectedRoomId(room.id)}
                          className="sr-only"
                        />
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                            checked ? "border-brand bg-brand text-white" : "border-slate-300 bg-white",
                          )}
                        >
                          {checked ? <Check aria-hidden className="h-3 w-3" /> : null}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          Room {room.roomNumber}
                          {room.floor ? (
                            <span className="ml-1.5 text-xs font-normal text-slate-400">
                              · Floor {room.floor}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {/* Step 4 — Guest details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-light text-[10px] font-bold text-brand-dark">
                4
              </span>
              Guest details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form id="walkin-booking-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  name="firstName"
                  label="First name"
                  required
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                />
                <Input
                  name="lastName"
                  label="Last name"
                  required
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                />
              </div>
              <Input
                name="email"
                label="Email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  name="phone"
                  label="Phone (optional)"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
                <Input
                  name="country"
                  label="Country (optional)"
                  autoComplete="country-name"
                  value={country}
                  onChange={(event) => setCountry(event.target.value)}
                />
              </div>
              <Textarea
                name="specialRequests"
                label="Special requests (optional)"
                rows={3}
                placeholder="Early check-in, extra pillows..."
                value={specialRequests}
                onChange={(event) => setSpecialRequests(event.target.value)}
              />

              {error ? (
                <p
                  role="alert"
                  className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </p>
              ) : null}

              {/* Mobile CTA (the sticky summary holds the primary one on desktop) */}
              <Button type="submit" loading={pending} className="w-full lg:hidden">
                {pending ? "Creating…" : "Create reservation"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ── Right column: sticky booking summary ─────────────────────── */}
      <div className="lg:sticky lg:top-24">
        <Card className="overflow-visible">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Wallet aria-hidden className="h-4 w-4 text-slate-400" />
              Booking summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Stay */}
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Stay
              </p>
              <div className="mt-1.5 flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {formatDateFriendly(checkIn)} → {formatDateFriendly(checkOut)}
                </span>
                <span className="ml-3 inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-subtle px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                  <Moon aria-hidden className="h-3 w-3 text-brand-brass" />
                  {nights} night{nights === 1 ? "" : "s"}
                </span>
              </div>
            </section>

            {/* Guests */}
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Guests
              </p>
              <p className="mt-1.5 text-sm text-slate-700">
                {Number(adults)} adult{Number(adults) === 1 ? "" : "s"}
                {Number(children) > 0
                  ? ` · ${Number(children)} child${Number(children) === 1 ? "" : "ren"}`
                  : ""}
              </p>
            </section>

            {/* Room */}
            <section>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Room
              </p>
              {selectedType ? (
                <div className="mt-1.5 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-800">{selectedType.name}</p>
                    <p className="text-xs text-slate-500">
                      {selectedRoom ? (
                        <>
                          Room {selectedRoom.roomNumber}
                          {selectedRoom.floor ? ` · Floor ${selectedRoom.floor}` : ""}
                        </>
                      ) : (
                        "Pick an available room"
                      )}
                    </p>
                  </div>
                  {selectedRoom ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      <Check aria-hidden className="h-3 w-3" />
                      Assigned
                    </span>
                  ) : null}
                </div>
              ) : (
                <p className="mt-1.5 text-sm text-slate-400">
                  {roomTypes === null ? "Search availability to see options" : "No room selected"}
                </p>
              )}
            </section>

            {/* Price */}
            <section className="border-t border-border-subtle pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Price
              </p>
              {selectedType ? (
                <dl className="mt-2 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">
                      {formatMoney(selectedType.basePrice, currency)} × {selectedType.nights} night
                      {selectedType.nights === 1 ? "" : "s"}
                    </dt>
                    <dd className="font-medium text-slate-700">
                      {formatMoney(selectedType.subtotal, currency)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Taxes</dt>
                    <dd className="font-medium text-slate-700">
                      {formatMoney(selectedType.tax, currency)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-border-subtle pt-2.5">
                    <dt className="text-sm font-semibold text-foreground">Total</dt>
                    <dd className="font-display text-lg font-bold text-foreground">
                      {formatMoney(selectedType.total, currency)}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-2 text-sm text-slate-400">
                  Select a room type to see the total.
                </p>
              )}
            </section>

            {/* CTA */}
            <div className="space-y-2.5 border-t border-border-subtle pt-4">
              <button
                type="submit"
                form="walkin-booking-form"
                disabled={!canSubmit || pending}
                className={cn(buttonVariants({ size: "lg" }), "w-full")}
              >
                {pending ? "Creating…" : "Create reservation"}
              </button>
              <p className="text-center text-[11px] text-slate-400">
                {!selectedRoomId
                  ? "Assign a room to continue"
                  : checkInNow
                    ? "Guest is checked in on arrival — collect payment at check-out."
                    : "Reservation starts PENDING — confirm before arrival."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
