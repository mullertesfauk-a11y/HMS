import type { Metadata } from "next";

import { SiteFooter } from "@/components/website/site-footer";
import { SiteHeader } from "@/components/website/site-header";
import { hotelService } from "@/server/services/hotel.service";

export const metadata: Metadata = {
  title: {
    default: "Grand Meridian Hotel",
    template: "%s · Grand Meridian Hotel",
  },
  description:
    "Book your stay at Grand Meridian Hotel — modern rooms, city views, and warm hospitality.",
};

export default async function WebsiteLayout({ children }: { children: React.ReactNode }) {
  const hotel = await hotelService.getPublicHotel();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader hotel={hotel} />
      <main className="flex-1">{children}</main>
      <SiteFooter hotel={hotel} />
    </div>
  );
}
