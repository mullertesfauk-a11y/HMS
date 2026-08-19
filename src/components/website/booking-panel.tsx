"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { statusMeta } from "@/lib/domain/labels";
import { formatDateFriendly, formatMoney } from "@/lib/utils/display";
import { createBooking } from "@/app/[locale]/(website)/actions";
import type { PublicReservationView } from "@/server/services/reservation.view";

export interface BookingPanelProps {
  roomTypeSlug: string;
  roomTypeName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  /** Number of children travelling with the adults. */
  childCount: number;
  nights: number;
  basePrice: number;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
}

/**
 * Guest booking form for a specific room type + stay. Submits to the
 * createBooking server action (validated + rate-limited server-side) and
 * shows the confirmation inline on success.
 */
export function BookingPanel({
  roomTypeSlug,
  roomTypeName,
  checkIn,
  checkOut,
  adults,
  childCount,
  nights,
  basePrice,
  subtotal,
  tax,
  total,
  currency,
}: BookingPanelProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<PublicReservationView | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createBooking({
        checkIn,
        checkOut,
        adults,
        children: childCount,
        roomTypeSlug,
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
      setConfirmation(result.reservation);
    });
  }

  if (confirmation) {
    const status = statusMeta(confirmation.status);
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 aria-hidden className="h-5 w-5" />
        </span>
        <h3 className="mt-3 text-lg font-semibold text-foreground">Reservation confirmed!</h3>
        <p className="mt-1 text-sm text-stone-600">
          Your reservation number is{" "}
          <span className="font-semibold text-foreground">
            {confirmation.reservationNumber}
          </span>
          . Keep it safe — you will need it (with your last name) to manage or cancel the booking.
        </p>

        <dl className="mt-5 space-y-2 rounded-lg bg-white p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">Status</dt>
            <dd className="font-medium" style={{ color: "inherit" }}>
              {status.label}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">Room type</dt>
            <dd className="font-medium text-foreground">{roomTypeName}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">Dates</dt>
            <dd className="font-medium text-foreground">
              {formatDateFriendly(checkIn)} → {formatDateFriendly(checkOut)} ({nights} night
              {nights !== 1 ? "s" : ""})
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-stone-500">Guests</dt>
            <dd className="font-medium text-foreground">
              {adults} adult{adults !== 1 ? "s" : ""}
              {childCount > 0 ? `, ${childCount} child${childCount !== 1 ? "ren" : ""}` : ""}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-stone-100 pt-2">
            <dt className="text-stone-500">Total (incl. tax)</dt>
            <dd className="font-semibold text-foreground">{formatMoney(total, currency)}</dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 shadow-2xl shadow-black/5 ring-1 ring-stone-900/5">
      <div className="border-b border-stone-200 pb-6">
        <h3 className="font-display text-2xl text-foreground">Reserve this room</h3>
        <p className="mt-2 text-sm text-stone-500">
          {formatDateFriendly(checkIn)} &mdash; {formatDateFriendly(checkOut)}<br />
          {nights} night{nights !== 1 ? "s" : ""} · {adults} Adult{adults !== 1 ? "s" : ""}
          {childCount > 0 ? ` · ${childCount} Child${childCount !== 1 ? "ren" : ""}` : ""}
        </p>
      </div>

      <div className="mt-6 space-y-2 text-sm text-stone-600">
        <div className="flex justify-between">
          <span>
            {formatMoney(basePrice, currency)} × {nights} night{nights !== 1 ? "s" : ""}
          </span>
          <span>{formatMoney(subtotal, currency)}</span>
        </div>
        <div className="flex justify-between">
          <span>Taxes</span>
          <span>{formatMoney(tax, currency)}</span>
        </div>
        <div className="mt-4 flex justify-between border-t border-stone-200 pt-4 font-display text-xl text-foreground">
          <span>Total</span>
          <span>{formatMoney(total, currency)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            name="firstName"
            label="First Name"
            required
            autoComplete="given-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
          <Input
            name="lastName"
            label="Last Name"
            required
            autoComplete="family-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </div>
        <Input
          name="email"
          label="Email Address"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
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
          label="Special Requests (optional)"
          rows={3}
          placeholder="Early check-in, extra pillows..."
          value={specialRequests}
          onChange={(event) => setSpecialRequests(event.target.value)}
        />

        {error ? (
          <p role="alert" className="mt-4 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <Button type="submit" loading={pending} size="lg" className="mt-6 w-full h-12">
          {pending ? "Processing…" : "Confirm Reservation"}
        </Button>
        <p className="mt-4 text-center text-xs uppercase tracking-widest text-stone-400">
          Payment is taken at the property
        </p>
      </form>
    </div>
  );
}
