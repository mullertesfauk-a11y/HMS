"use client";

import { NextIntlClientProvider } from "next-intl";
import { useLocale, useMessages } from "next-intl";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const messages = useMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
