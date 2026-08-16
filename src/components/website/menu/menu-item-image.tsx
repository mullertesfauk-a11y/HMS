"use client";

import React from "react";
import { UtensilsCrossed } from "lucide-react";

export function MenuItemImage({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const [state, setState] = React.useState<"loading" | "loaded" | "error">(
    src ? "loading" : "error",
  );

  if (!src || state === "error") {
    return (
      <div
        className={
          className ??
          "relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-stone-100"
        }
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-stone-50 to-stone-100">
          <UtensilsCrossed className="h-8 w-8 text-stone-300" />
          <span className="text-[10px] font-medium uppercase tracking-widest text-stone-400">
            Gurja Hotel
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        className ??
        "relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-stone-100"
      }
    >
      {/* Skeleton shimmer */}
      {state === "loading" && (
        <div className="absolute inset-0 animate-pulse bg-stone-200" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setState("loaded")}
        onError={() => setState("error")}
        className={`h-full w-full object-cover transition-all duration-500 ${
          state === "loaded"
            ? "opacity-100 group-hover:scale-[1.03]"
            : "opacity-0"
        }`}
      />
    </div>
  );
}
