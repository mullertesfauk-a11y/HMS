import Link from "next/link";
import { useTranslations } from "next-intl";
import type { PublicHotel } from "@/server/services/hotel.service";
import { HotelLogo } from "@/components/ui/hotel-logo";

/** Public website footer: contact details and check-in/out times. */
export function SiteFooter({ hotel }: { hotel: PublicHotel }) {
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");

  const contact = [
    hotel.address && hotel.city ? `${hotel.address}, ${hotel.city}` : (hotel.address ?? hotel.city),
    hotel.country,
    hotel.phone,
    hotel.email,
  ].filter(Boolean);

  return (
    <footer className="border-t border-stone-800 bg-stone-950 text-stone-400">
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-16 sm:grid-cols-2 lg:grid-cols-4 sm:px-8">
        <div className="lg:col-span-1">
          <HotelLogo
            name={hotel.name || "GURJA"}
            subtitle="HOTEL"
            variant="light"
            size="md"
            layout="left-stacked"
            href="/"
          />
          <p className="mt-5 text-sm leading-relaxed text-stone-400">{hotel.description}</p>
        </div>
        
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white">{t("hotel")}</p>
          <ul className="mt-6 space-y-3 text-sm">
            <li><Link href="/rooms" className="transition-colors hover:text-brand-light">{tNav("rooms")}</Link></li>
            <li><Link href="/menu" className="transition-colors hover:text-brand-light">{tNav("restaurant")}</Link></li>
            <li><Link href="/reservation/lookup" className="transition-colors hover:text-brand-light">{tNav("findBooking")}</Link></li>
            <li><Link href="/table-qr" className="transition-colors hover:text-brand-light">Table QR Stand</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white">{t("contact")}</p>
          <ul className="mt-6 space-y-3 text-sm">
            {contact.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
        
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white">
            {t("checkInCheckOut")}
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            <li>{t("checkInFrom", { time: hotel.checkInTime })}</li>
            <li>{t("checkOutBy", { time: hotel.checkOutTime })}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-stone-800">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-8">
          <p className="text-xs">
            © {new Date().getUTCFullYear()} {hotel.name}. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs uppercase tracking-widest">
            <Link href="#" className="transition-colors hover:text-white">{t("privacy")}</Link>
            <Link href="#" className="transition-colors hover:text-white">{t("terms")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
