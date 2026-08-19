import { defineRouting } from "next-intl/routing";

export const locales = ["am", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "am";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
});
