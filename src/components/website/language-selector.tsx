"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const LOCALES = [
  { code: "am" as const, label: "አማርኛ", flag: "🇪🇹" },
  { code: "en" as const, label: "English", flag: "🇬🇧" },
];

export function LanguageSelector({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common");

  function switchLocale(newLocale: string) {
    // Build the new path: remove current locale prefix (if any) and add new one
    let newPath = pathname;

    // Strip existing locale prefix
    for (const loc of LOCALES) {
      if (pathname.startsWith(`/${loc.code}/`)) {
        newPath = pathname.slice(`/${loc.code}`.length) || "/";
        break;
      }
    }

    // For default locale (am), no prefix needed
    if (newLocale === "am") {
      router.push(newPath);
    } else {
      router.push(`/${newLocale}${newPath === "/" ? "" : newPath}`);
    }

    // Set cookie to persist preference
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=${60 * 60 * 24 * 365}`;
  }

  return (
    <div className={cn("relative group", className)}>
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 transition-all hover:border-stone-300 hover:shadow-sm"
        aria-label={t("search")}
      >
        <Globe className="h-3.5 w-3.5 text-stone-400" />
        <span>{LOCALES.find((l) => l.code === locale)?.flag}</span>
        <span className="hidden sm:inline uppercase tracking-wider">
          {locale}
        </span>
      </button>

      {/* Dropdown */}
      <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 absolute right-0 top-full z-50 mt-1 w-40 rounded-xl border border-stone-200 bg-white py-1.5 shadow-xl transition-all duration-200">
        {LOCALES.map((loc) => (
          <button
            key={loc.code}
            type="button"
            onClick={() => switchLocale(loc.code)}
            className={cn(
              "flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-medium transition-colors hover:bg-stone-50",
              locale === loc.code
                ? "text-brand bg-brand-light/50"
                : "text-stone-600",
            )}
          >
            <span className="text-base">{loc.flag}</span>
            <span>{loc.label}</span>
            {locale === loc.code && (
              <span className="ml-auto text-brand">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
