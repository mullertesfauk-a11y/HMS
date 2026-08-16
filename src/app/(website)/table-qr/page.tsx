import type { Metadata } from "next";
import { TableQrCard } from "@/components/website/table-qr-card";
import { hotelService } from "@/server/services/hotel.service";

export const metadata: Metadata = {
  title: "Printable QR Table Stand · Gurja Hotel",
  description: "Print luxury QR table tents and stand cards for tables, suites, and guest rooms.",
};

export default async function TableQrPage() {
  const hotel = await hotelService.getPublicHotel();

  return (
    <div className="min-h-screen bg-stone-100/60 pb-20 pt-8 print:bg-white print:p-0">
      <TableQrCard
        initialUrl="https://gurjahotel.com/menu"
        hotelName={hotel.name || "Gurja Hotel"}
        city={hotel.city || "Shire, Tigray"}
      />
    </div>
  );
}
