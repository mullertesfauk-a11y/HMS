import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export interface HotelLogoProps {
  /** The primary brand name (defaults to "GURJA") */
  name?: string;
  /** Subtitle or descriptor text (defaults to "HOTEL") */
  subtitle?: string;
  /** Color theme variant */
  variant?: "dark" | "light" | "brass" | "emerald";
  /** Size scale */
  size?: "sm" | "md" | "lg" | "xl";
  /** Layout lockup style */
  layout?: "stacked" | "inline" | "left-stacked";
  /** Whether to show the subtitle */
  showSubtitle?: boolean;
  /** Optional link destination (e.g., "/" for public header) */
  href?: string;
  /** Optional typographic monogram emblem */
  showMonogram?: boolean;
  /** Additional container classes */
  className?: string;
}

/**
 * Premium Text Logo for Gurja Hotel.
 *
 * Implements high-end hospitality typographic standards:
 * - Classical Roman / luxury serif letterforms (Cinzel / Playfair)
 * - Extended optical tracking & balanced optical kerning
 * - Polished brass accent dividers and delicate diamond motifs
 * - Full responsive scaling across headers, footers, admin portals, and login screens
 */
export function HotelLogo({
  name = "GURJA",
  subtitle = "HOTEL",
  variant = "dark",
  size = "md",
  layout = "stacked",
  showSubtitle = true,
  href,
  showMonogram = false,
  className,
}: HotelLogoProps) {
  // Extract primary name and strip redundant "Hotel" if present in input string
  const cleanName = name
    ? name.replace(/^(the\s+)?(gurja)\s*(hotel)?$/i, "$2").trim() || name
    : "GURJA";

  const upperName = cleanName.toUpperCase();
  const upperSubtitle = subtitle.toUpperCase();
  const initialLetter = upperName.charAt(0) || "G";

  // Size styling tokens
  const sizeStyles = {
    sm: {
      brand: "text-base sm:text-lg font-semibold",
      brandTracking: "0.22em",
      subtitle: "text-[8px] sm:text-[9px] font-medium",
      subtitleTracking: "0.38em",
      divider: "w-2 sm:w-2.5",
      subSpacing: "mt-0.5",
      monogram: "h-7 w-7 text-xs",
      diamond: "text-[5px]",
    },
    md: {
      brand: "text-xl sm:text-2xl font-semibold",
      brandTracking: "0.24em",
      subtitle: "text-[9px] sm:text-[10px] font-semibold",
      subtitleTracking: "0.42em",
      divider: "w-2.5 sm:w-3.5",
      subSpacing: "mt-0.5 sm:mt-1",
      monogram: "h-8 w-8 text-sm",
      diamond: "text-[6px]",
    },
    lg: {
      brand: "text-2xl sm:text-3xl font-semibold",
      brandTracking: "0.26em",
      subtitle: "text-[10px] sm:text-xs font-semibold",
      subtitleTracking: "0.46em",
      divider: "w-3 sm:w-4",
      subSpacing: "mt-1",
      monogram: "h-10 w-10 text-base",
      diamond: "text-[7px]",
    },
    xl: {
      brand: "text-3xl sm:text-4xl md:text-5xl font-semibold",
      brandTracking: "0.28em",
      subtitle: "text-xs sm:text-sm font-semibold",
      subtitleTracking: "0.48em",
      divider: "w-5 sm:w-8",
      subSpacing: "mt-1.5",
      monogram: "h-12 w-12 text-lg",
      diamond: "text-[8px]",
    },
  }[size];

  // Color variant tokens
  const colorStyles = {
    dark: {
      brand: "text-stone-900 group-hover:text-stone-950 transition-colors",
      subtitle: "text-brand-brass",
      divider: "bg-brand-brass/60",
      diamond: "text-brand-brass",
      monogramBorder: "border-brand-brass/60 bg-stone-50 text-stone-900",
    },
    light: {
      brand: "text-stone-50 group-hover:text-white transition-colors",
      subtitle: "text-amber-300/90",
      divider: "bg-amber-300/60",
      diamond: "text-amber-300/90",
      monogramBorder: "border-amber-300/60 bg-stone-900/80 text-amber-200",
    },
    brass: {
      brand: "text-brand-brass group-hover:text-amber-600 transition-colors",
      subtitle: "text-stone-600",
      divider: "bg-stone-400/60",
      diamond: "text-brand-brass",
      monogramBorder: "border-brand-brass bg-brand-brass/10 text-brand-brass",
    },
    emerald: {
      brand: "text-brand group-hover:text-brand-dark transition-colors",
      subtitle: "text-brand-brass",
      divider: "bg-brand-brass/60",
      diamond: "text-brand-brass",
      monogramBorder: "border-brand bg-brand-light text-brand",
    },
  }[variant];

  const content = (
    <div
      className={cn(
        "group inline-flex items-center transition-transform duration-200",
        layout === "stacked" && "flex-col text-center",
        layout === "left-stacked" && "flex-col items-start text-left",
        layout === "inline" && "flex-row items-center gap-2 sm:gap-2.5",
        className
      )}
    >
      {/* Optional Typographic Monogram */}
      {showMonogram && (
        <div
          className={cn(
            "flex items-center justify-center rounded-sm border font-serif transition-colors",
            sizeStyles.monogram,
            colorStyles.monogramBorder,
            layout !== "inline" && "mb-1.5"
          )}
          aria-hidden="true"
        >
          <span>{initialLetter}</span>
        </div>
      )}

      {/* Main Text Logo Lockup - Unified cohesive typographic container */}
      <div
        className={cn(
          "flex flex-col select-none",
          layout === "stacked" && "items-center",
          layout === "left-stacked" && "items-start",
          layout === "inline" && "flex-row items-baseline gap-1.5"
        )}
      >
        {/* Primary Wordmark */}
        <span
          className={cn(
            "font-luxury uppercase leading-none select-none tracking-widest",
            sizeStyles.brand,
            colorStyles.brand
          )}
          style={{
            letterSpacing: sizeStyles.brandTracking,
            marginRight: `-${sizeStyles.brandTracking}`, // Perfectly offsets trailing letter space for optical centering
          }}
        >
          {upperName}
        </span>

        {/* Subtitle / Descriptor - Connected tightly as a cohesive unit */}
        {showSubtitle && (
          <div
            className={cn(
              "flex items-center select-none leading-none",
              layout === "stacked" && "w-full justify-center",
              layout === "left-stacked" && "justify-start",
              layout === "inline" && "inline-flex items-center",
              layout !== "inline" && sizeStyles.subSpacing
            )}
          >
            {layout === "stacked" && (
              <span
                className={cn("h-[1px] inline-block opacity-70", sizeStyles.divider, colorStyles.divider)}
                aria-hidden="true"
              />
            )}

            <span
              className={cn(
                "inline-flex items-center uppercase leading-none font-sans px-1 select-none",
                sizeStyles.subtitle,
                colorStyles.subtitle
              )}
              style={{
                letterSpacing: sizeStyles.subtitleTracking,
                marginRight: `-${sizeStyles.subtitleTracking}`, // Optical centering compensation
              }}
            >
              {layout === "inline" && (
                <span className={cn("mx-1 select-none", sizeStyles.diamond, colorStyles.diamond)} aria-hidden="true">
                  ✦
                </span>
              )}
              {upperSubtitle}
            </span>

            {layout === "stacked" && (
              <span
                className={cn("h-[1px] inline-block opacity-70", sizeStyles.divider, colorStyles.divider)}
                aria-hidden="true"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-brass rounded-sm"
        aria-label={`${upperName} ${upperSubtitle}`}
      >
        {content}
      </Link>
    );
  }

  return content;
}
