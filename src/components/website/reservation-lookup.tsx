"use client";

import { useState, useTransition } from "react";
import { CalendarDays, Search } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/admin/status-badge";
import { statusMeta } from "@/lib/domain/labels";
import { formatDateFriendly, formatMoney } from "@/lib/utils/display";
import { cancelReservation, lookupReservation } from "@/app/(website)/actions";
import type { PublicReservationView } from "@/server/services/reservation.view";

/**
 * Guest-facing reservation lookup + cancel. Uses the number + last name
 * privacy gate, matching the public API.
 */
export function ReservationLookup() {
  const t = useTranslations("reservation");
  const tCommon = useTranslations("common");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [reservation, setReservation] = useState<PublicReservationView | null>(null);

  const [reservationNumber, setReservationNumber] = useState("");
  const [lastName, setLastName] = useState("");

  function handleLookup(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await lookupReservation({
        reservationNumber: reservationNumber.trim().toUpperCase(),
        lastName: lastName.trim(),
      });
      if (!result.ok) {
        setReservation(null);
        setError(result.error);
        return;
      }
      setReservation(result.reservation);
    });
  }

  function handleCancel() {
    setError(null);
    if (!reservation) return;
    startTransition(async () => {
      const result = await cancelReservation({
        reservationNumber: reservation.reservationNumber,
        lastName: lastName.trim(),
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setReservation(result.reservation);
    });
  }

  const cancellable = reservation && ["PENDING", "CONFIRMED"].includes(reservation.status);

  return (
    <div className="space-y-12">
      <form onSubmit={handleLookup} className="bg-white p-8 sm:p-12 shadow-2xl shadow-black/5 ring-1 ring-stone-900/5">
        <div className="grid gap-6 sm:grid-cols-2">
          <Input
            name="reservationNumber"
            label={t("reservationNumber")}
            required
            placeholder="HTL-2026-XXXXXX"
            value={reservationNumber}
            onChange={(event) => setReservationNumber(event.target.value)}
          />
          <Input
            name="lastName"
            label={t("lastName")}
            required
            autoComplete="family-name"
            placeholder="e.g. Doe"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </div>

        {error ? (
          <p role="alert" className="mt-6 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-8 flex justify-end">
          <Button type="submit" loading={pending} size="lg" className="w-full sm:w-auto h-12">
            <Search aria-hidden className="mr-2 h-4 w-4" />
            {pending ? t("lookingUp") : t("findReservation")}
          </Button>
        </div>
      </form>

      {reservation ? (
        <div className="bg-white p-8 sm:p-12 shadow-2xl shadow-black/5 ring-1 ring-stone-900/5">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-stone-200 pb-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-stone-400">
                {t("reservationDetails")}
              </p>
              <p className="mt-2 font-display text-4xl text-foreground">
                {reservation.reservationNumber}
              </p>
            </div>
            <StatusBadge value={reservation.status} />
          </div>

          <div className="mt-8 grid gap-12 sm:grid-cols-2">
            <dl className="space-y-6 text-sm text-stone-600">
              <div>
                <dt className="text-xs uppercase tracking-widest text-stone-400">{t("guestName")}</dt>
                <dd className="mt-1 font-medium text-foreground text-base">
                  {reservation.guest.firstName} {reservation.guest.lastName}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-stone-400">{t("roomType")}</dt>
                <dd className="mt-1 font-medium text-foreground text-base">
                  {reservation.rooms[0]?.roomType.name ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-stone-400">{t("totalPrice")}</dt>
                <dd className="mt-1 font-display text-2xl text-foreground">
                  {formatMoney(reservation.pricing.total, reservation.pricing.currency)}
                </dd>
              </div>
            </dl>

            <dl className="space-y-6 text-sm text-stone-600">
              <div>
                <dt className="text-xs uppercase tracking-widest text-stone-400">{t("stayDates")}</dt>
                <dd className="mt-1 font-medium text-foreground text-base flex items-center gap-2">
                  <CalendarDays aria-hidden className="h-4 w-4 text-stone-400" />
                  {formatDateFriendly(reservation.checkIn)} &mdash; {formatDateFriendly(reservation.checkOut)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-stone-400">{t("duration")}</dt>
                <dd className="mt-1 font-medium text-foreground text-base">
                  {reservation.nights} Night{reservation.nights !== 1 ? "s" : ""}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-widest text-stone-400">{tCommon("guests")}</dt>
                <dd className="mt-1 font-medium text-foreground text-base">
                  {reservation.adults} Adult{reservation.adults !== 1 ? "s" : ""}
                  {reservation.children > 0
                    ? ` · ${reservation.children} Child${reservation.children !== 1 ? "ren" : ""}`
                    : ""}
                </dd>
              </div>
            </dl>
          </div>

          {reservation.specialRequests ? (
            <div className="mt-12 bg-stone-50 p-6 ring-1 ring-stone-900/5">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-stone-500">{t("specialRequests")}</h4>
              <p className="mt-3 text-sm leading-relaxed text-stone-600">
                {reservation.specialRequests}
              </p>
            </div>
          ) : null}

          <div className="mt-12 border-t border-stone-200 pt-8">
            {cancellable ? (
              <div className="flex flex-col items-center justify-between gap-6 sm:flex-row bg-stone-50 p-6 ring-1 ring-stone-900/5">
                <p className="text-sm text-stone-600">
                  {t("plansChanged")}
                </p>
                <Button
                  type="button"
                  variant="dangerGhost"
                  loading={pending}
                  onClick={handleCancel}
                  className="w-full sm:w-auto"
                >
                  {t("cancelReservation")}
                </Button>
              </div>
            ) : (
              <div className="bg-stone-50 p-6 text-center ring-1 ring-stone-900/5">
                <p className="text-sm text-stone-500">
                  {t("noLongerCancellable", { status: statusMeta(reservation.status).label.toLowerCase() })}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
