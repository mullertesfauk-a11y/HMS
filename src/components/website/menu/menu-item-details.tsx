"use client";

import React from "react";
import { X } from "lucide-react";
import type { MenuItem } from "@/lib/menu/menu-types";
import { formatMoney } from "@/lib/utils/display";
import { DietaryBadge } from "@/components/website/menu/dietary-badge";

export function MenuItemDetails({
  item,
  currency,
  onClose,
}: {
  item: MenuItem;
  currency: string;
  onClose: () => void;
}) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const [imgLoaded, setImgLoaded] = React.useState(false);

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

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-0 mt-auto h-[92svh] w-full max-h-[92svh] overflow-y-auto rounded-t-3xl border border-stone-200 bg-white shadow-2xl backdrop:bg-black/40 sm:mt-auto sm:h-auto sm:max-h-[85vh] sm:w-full sm:max-w-lg sm:rounded-2xl sm:m-auto open:flex open:flex-col"
      aria-labelledby="menu-detail-title"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-stone-100 sm:aspect-[3/2] sm:rounded-t-2xl">
        {item.image ? (
          <>
            {!imgLoaded && <div className="absolute inset-0 animate-pulse bg-stone-200" />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image}
              alt={item.name}
              onLoad={() => setImgLoaded(true)}
              className={`h-full w-full object-cover transition-opacity duration-300 ${
                imgLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100">
            <span className="text-2xl">🍽</span>
            <span className="mt-2 text-[10px] font-medium uppercase tracking-widest text-stone-400">
              Gurja Hotel
            </span>
          </div>
        )}

        {/* Close button — visible on top of image */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-md backdrop-blur-sm transition-colors hover:bg-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="menu-detail-title"
              className="font-luxury text-2xl font-semibold text-stone-900"
            >
              {item.name}
            </h2>
            <span lang="am" className="text-sm text-stone-400">
              {item.nameAm}
            </span>
          </div>
          <span className="shrink-0 font-luxury text-xl font-bold text-stone-900">
            {formatMoney(item.price, currency)}
          </span>
        </div>

        {/* Badges */}
        {item.badges.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.badges.map((b) => (
              <span
                key={b}
                className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-800 border border-amber-200"
              >
                {b === "chef-pick" ? "Chef's Pick" : b === "popular" ? "Popular" : "New"}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        <p className="mt-4 text-sm leading-relaxed text-stone-600">
          {item.description}
        </p>

        {/* Dietary */}
        {item.dietaryTags.length > 0 && (
          <div className="mt-5">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">
              Dietary Information
            </h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {item.dietaryTags.map((tag) => (
                <DietaryBadge key={tag} tag={tag} />
              ))}
            </div>
          </div>
        )}

        {/* Availability */}
        {!item.isAvailable && (
          <div className="mt-5 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-xs text-stone-500">
            This dish is currently unavailable. Please ask your server for
            today&apos;s alternative.
          </div>
        )}

        {/* Future order slot — reserved for ordering CTA */}
        <div className="mt-auto pt-6">
          <div className="border-t border-stone-200 pt-4">
            <button
              type="button"
              disabled={!item.isAvailable}
              className="inline-flex h-12 w-full items-center justify-center rounded-sm bg-stone-900 text-xs font-semibold uppercase tracking-widest text-white transition-colors hover:bg-brand disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-stone-900"
            >
              {item.isAvailable ? "View Details" : "Currently Unavailable"}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
