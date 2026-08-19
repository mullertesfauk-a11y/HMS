import { hotelService } from "@/server/services/hotel.service";
import { menuService } from "@/server/services/menu.service";
import { LandingFeed } from "@/components/website/landing-feed";

// Hotel info + room rates + menu come from the live DB — never cache at build time.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [hotel, roomTypes, menu] = await Promise.all([
    hotelService.getPublicHotel(),
    hotelService.getRoomTypes(),
    menuService.getPublicMenu(),
  ]);

  return (
    <LandingFeed
      hotel={hotel}
      roomTypes={roomTypes}
      items={menu.items}
    />
  );
}
