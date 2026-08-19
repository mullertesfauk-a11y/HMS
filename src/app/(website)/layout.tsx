import type { Metadata } from "next";

import { SiteFooter } from "@/components/website/site-footer";
import { SiteHeader } from "@/components/website/site-header";
import { hotelService } from "@/server/services/hotel.service";
import { I18nProvider } from "@/i18n/provider";

export const metadata: Metadata = {
  title: {
    default: "Gurja Hotel",
    template: "%s · Gurja Hotel",
  },
  description:
    "Book your stay at Gurja Hotel — luxury suites, city views, and timeless Ethiopian hospitality.",
};

export default async function WebsiteLayout({ children }: { children: React.ReactNode }) {
  const hotel = await hotelService.getPublicHotel();

  return (
    <I18nProvider>
      <div className="flex min-h-screen flex-col">
        <SiteHeader hotel={hotel} />
        <main className="flex-1">{children}</main>
        <SiteFooter hotel={hotel} />
      </div>
    </I18nProvider>
  );
}
