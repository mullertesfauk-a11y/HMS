"use client";

import { useRouter } from "next/navigation";

import { DataTable } from "@/components/admin/data-table";
import { reservationColumns, type ReservationRow } from "@/components/admin/reservations/reservation-columns";

export function GuestHistory({
  upcoming,
  previous,
  currency,
}: {
  upcoming: ReservationRow[];
  previous: ReservationRow[];
  currency: string;
}) {
  const router = useRouter();
  const columns = reservationColumns(currency);

  return (
    <div className="space-y-6">
      <section aria-labelledby="upcoming-history">
        <h2 id="upcoming-history" className="text-base font-semibold text-foreground">
          Upcoming reservations
        </h2>
        <div className="mt-3">
          <DataTable
            columns={columns}
            data={upcoming}
            getRowId={(row) => row.id}
            onRowClick={(row) => router.push(`/admin/reservations/${row.id}`)}
            emptyTitle="No upcoming reservations"
            emptyDescription="This guest has no upcoming stays."
          />
        </div>
      </section>

      <section aria-labelledby="previous-history">
        <h2 id="previous-history" className="text-base font-semibold text-foreground">
          Previous reservations
        </h2>
        <div className="mt-3">
          <DataTable
            columns={columns}
            data={previous}
            getRowId={(row) => row.id}
            onRowClick={(row) => router.push(`/admin/reservations/${row.id}`)}
            emptyTitle="No previous reservations"
            emptyDescription="This guest has no past stays yet."
          />
        </div>
      </section>
    </div>
  );
}
