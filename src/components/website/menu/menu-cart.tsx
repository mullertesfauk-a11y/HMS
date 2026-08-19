"use client";

import React from "react";
import { CheckCircle2, Minus, Plus, Trash2, X } from "lucide-react";
import { useTranslations } from "next-intl";

import { formatMoney } from "@/lib/utils/display";
import { placeOrder } from "@/app/(website)/actions";
import type { PublicOrderView } from "@/server/services/order.view";

export interface CartLine {
  slug: string;
  name: string;
  price: number;
  quantity: number;
}

type Step = "review" | "checkout" | "confirmed";

/**
 * Order cart dialog: line-item review → guest details + place order →
 * confirmation with the order number. Payment is settled offline (pay on
 * delivery / at the counter), so there is no payment step.
 */
export function MenuCart({
  lines,
  currency,
  taxRate,
  onUpdateQuantity,
  onRemove,
  onClear,
  onClose,
}: {
  lines: CartLine[];
  currency: string;
  taxRate: number;
  onUpdateQuantity: (slug: string, quantity: number) => void;
  onRemove: (slug: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const t = useTranslations("menu");
  const tCommon = useTranslations("common");
  const ref = React.useRef<HTMLDialogElement>(null);
  const [step, setStep] = React.useState<Step>("review");
  const [guestName, setGuestName] = React.useState("");
  const [guestPhone, setGuestPhone] = React.useState("");
  const [deliveryNotes, setDeliveryNotes] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [placing, setPlacing] = React.useState(false);
  const [confirmedOrder, setConfirmedOrder] = React.useState<PublicOrderView | null>(null);

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (!dialog.open) {
      dialog.showModal();
    }
  }, []);

  React.useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    dialog.addEventListener("keydown", handleEscape);
    return () => dialog.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const tax = Math.round(subtotal * taxRate) / 100;
  const total = subtotal + tax;

  async function handlePlaceOrder() {
    setPlacing(true);
    setError(null);
    const result = await placeOrder({
      guestName,
      guestPhone,
      deliveryNotes: deliveryNotes.trim() || undefined,
      items: lines.map((line) => ({ slug: line.slug, quantity: line.quantity })),
    });
    setPlacing(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setConfirmedOrder(result.order);
    setStep("confirmed");
  }

  function handleDone() {
    onClear();
    onClose();
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-0 mt-auto h-[92svh] w-full max-h-[92svh] overflow-y-auto rounded-t-3xl border border-stone-200 bg-white shadow-2xl backdrop:bg-black/40 sm:mt-auto sm:h-auto sm:max-h-[85vh] sm:w-full sm:max-w-xl md:max-w-2xl sm:rounded-2xl sm:m-auto open:flex open:flex-col pb-safe"
      aria-labelledby="menu-cart-title"
    >
      {/* Mobile drag handle */}
      <div className="flex justify-center pt-3 sm:hidden">
        <span className="h-1 w-10 rounded-full bg-stone-300" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 sm:px-6">
        <h2 id="menu-cart-title" className="font-luxury text-lg font-semibold uppercase tracking-wider text-stone-900">
          {step === "confirmed" ? t("orderConfirmed") : t("yourOrder")}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={tCommon("close")}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {step === "review" && (
        <div className="flex flex-1 flex-col">
          {lines.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
              <p className="text-sm text-stone-500">{t("cartEmpty")}</p>
              <button
                type="button"
                onClick={handleDone}
                className="rounded-full border border-stone-200 px-5 py-2 text-xs font-semibold uppercase tracking-widest text-stone-700 transition-colors hover:border-stone-400"
              >
                {t("backToMenu")}
              </button>
            </div>
          ) : (
            <>
              <ul className="flex-1 divide-y divide-stone-100 px-5 pt-4 sm:px-6">
                {lines.map((line) => (
                  <li key={line.slug} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-stone-900">{line.name}</p>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {formatMoney(line.price, currency)} {t("each")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-stone-200 px-1 py-0.5">
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(line.slug, line.quantity - 1)}
                        aria-label={`Decrease ${line.name} quantity`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold text-stone-900">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => onUpdateQuantity(line.slug, line.quantity + 1)}
                        aria-label={`Increase ${line.name} quantity`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="w-16 text-right text-sm font-semibold text-stone-900">
                      {formatMoney(line.price * line.quantity, currency)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemove(line.slug)}
                      aria-label={`Remove ${line.name}`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-stone-300 transition-colors hover:bg-stone-100 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>

              {/* Totals */}
              <div className="space-y-1.5 border-t border-stone-200 px-5 py-4 text-sm sm:px-6">
                <div className="flex justify-between text-stone-500">
                  <span>{t("subtotal")}</span>
                  <span>{formatMoney(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>{t("tax")}</span>
                  <span>{formatMoney(tax, currency)}</span>
                </div>
                <div className="flex justify-between pt-1 text-base font-bold text-stone-900">
                  <span>{t("total")}</span>
                  <span>{formatMoney(total, currency)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("checkout")}
                  className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-sm bg-stone-900 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-brand"
                >
                  {t("continueToCheckout")}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {step === "checkout" && (
        <div className="flex flex-1 flex-col px-5 pt-4 sm:px-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="cart-name" className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-stone-400">
                {t("yourName")}
              </label>
              <input
                id="cart-name"
                type="text"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="e.g. Abebe Kebede"
                className="h-11 w-full rounded-lg border border-stone-200 px-3.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200"
              />
            </div>
            <div>
              <label htmlFor="cart-phone" className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-stone-400">
                {t("phoneNumber")}
              </label>
              <input
                id="cart-phone"
                type="tel"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="e.g. +251 91 000 0000"
                className="h-11 w-full rounded-lg border border-stone-200 px-3.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200"
              />
            </div>
            <div>
              <label htmlFor="cart-notes" className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-stone-400">
                {t("deliveryNotes")} <span className="font-normal normal-case tracking-normal text-stone-300">({tCommon("optional")})</span>
              </label>
              <textarea
                id="cart-notes"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="Room number, pickup time, or any special requests…"
                rows={3}
                className="w-full resize-none rounded-lg border border-stone-200 px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-200"
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
              {error}
            </p>
          )}

          <div className="mt-auto pt-6">
            <div className="space-y-1.5 border-t border-stone-200 pt-4 text-sm">
              <div className="flex justify-between text-stone-500">
                <span>{t("subtotal")}</span>
                <span>{formatMoney(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-stone-500">
                <span>{t("tax")}</span>
                <span>{formatMoney(tax, currency)}</span>
              </div>
              <div className="flex justify-between pt-1 text-base font-bold text-stone-900">
                <span>{t("total")}</span>
                <span>{formatMoney(total, currency)}</span>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setStep("review")}
                className="inline-flex h-12 items-center justify-center rounded-sm border border-stone-200 px-5 text-xs font-semibold uppercase tracking-widest text-stone-600 transition-colors hover:border-stone-400"
              >
                {t("backButton")}
              </button>
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={placing || !guestName.trim() || !guestPhone.trim()}
                className="inline-flex h-12 flex-1 items-center justify-center rounded-sm bg-stone-900 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-brand disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-stone-900"
              >
                {placing ? t("placingOrder") : t("placeOrder")}
              </button>
            </div>
            <p className="mt-3 text-center text-[11px] text-stone-400">
              {t("payOnDelivery")}
            </p>
          </div>
        </div>
      )}

      {step === "confirmed" && confirmedOrder && (
        <div className="flex flex-1 flex-col items-center px-5 pb-8 pt-10 text-center sm:px-6">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          <h3 className="mt-4 font-luxury text-2xl font-semibold text-stone-900">
            {t("orderPlaced")}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-stone-500">
            {t("orderThankYou", { name: confirmedOrder.guestName.split(" ")[0] })}
          </p>
          <div className="mt-6 w-full rounded-xl border border-stone-200 bg-stone-50 px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">
              {t("orderNumber")}
            </p>
            <p className="mt-1 font-mono text-xl font-bold tracking-wide text-stone-900">
              {confirmedOrder.orderNumber}
            </p>
            <p className="mt-2 text-sm text-stone-500">
              {t("totalDueOnDelivery")}:{" "}
              <span className="font-semibold text-stone-900">
                {formatMoney(confirmedOrder.pricing.total, confirmedOrder.pricing.currency)}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={handleDone}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-sm bg-stone-900 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-brand"
          >
            {tCommon("done")}
          </button>
        </div>
      )}
    </dialog>
  );
}
