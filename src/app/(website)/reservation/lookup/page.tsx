import type { Metadata } from "next";

import { ReservationLookup } from "@/components/website/reservation-lookup";

export const metadata: Metadata = {
  title: "Find my booking",
  description: "Look up your reservation by booking number and last name.",
};

export default function LookupPage() {
  return (
    <div className="bg-surface min-h-[calc(100vh-200px)]">
      <div className="bg-stone-950 py-16 sm:py-24">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-8 text-center">
          <h1 className="font-display text-4xl text-white sm:text-5xl">Manage your stay</h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-stone-300">
            Enter your reservation number and last name to view details or cancel your booking.
          </p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-3xl px-4 pb-24 sm:px-8">
        <div className="mt-[-4rem] relative z-10">
          <ReservationLookup />
        </div>
      </div>
    </div>
  );
}
