import type { Metadata } from "next";

import { MenuHero } from "@/components/website/menu/menu-hero";
import { MenuBrowser } from "@/components/website/menu/menu-browser";
import { hotelService } from "@/server/services/hotel.service";
import { menuService } from "@/server/services/menu.service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Restaurant Menu",
  description:
    "Browse the Gurja Hotel restaurant menu — traditional Ethiopian dishes, grilled specialties, and carefully prepared hotel favorites.",
  alternates: { canonical: "/menu" },
};

export default async function MenuPage() {
  const hotel = await hotelService.getPublicHotel();
  const menu = await menuService.getPublicMenu();

  return (
    <div className="bg-surface">
      <MenuHero hotel={hotel} />

      {/* Spacer to pull content up slightly for visual overlap with hero, like the rooms page */}
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 lg:py-12">
        <MenuBrowser
          categories={menu.categories}
          items={menu.items}
          currency={hotel.currency}
          taxRate={hotel.taxRate}
        />
      </div>
    </div>
  );
}
