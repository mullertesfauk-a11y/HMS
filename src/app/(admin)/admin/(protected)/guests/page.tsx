import { GuestsTable, type GuestRow } from "@/components/admin/guests/guests-table";
import { GuestsToolbar } from "@/components/admin/guests/guests-toolbar";
import { requirePermissionPage } from "@/lib/permissions";
import { adminGuestListSchema, parseListQuery } from "@/lib/validation/admin";
import { guestService } from "@/server/services/guest.service";

function formatDateOnly(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default async function GuestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermissionPage("guests.read");
  const rawParams = await searchParams;

  let query: ReturnType<typeof parseListQuery<typeof adminGuestListSchema>>;
  try {
    query = parseListQuery(adminGuestListSchema, rawParams);
  } catch {
    query = parseListQuery(adminGuestListSchema, {});
  }

  const { items, total } = await guestService.list({
    search: query.search,
    page: query.page,
    pageSize: query.pageSize,
  });

  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  const rows: GuestRow[] = items.map((guest) => {
    const latest = guest.reservations[0];
    // "Last stay" = most recent completed stay (checked out), else latest date.
    let lastStay: string | null = null;
    if (latest && (latest.status === "CHECKED_OUT" || latest.status === "CANCELLED" || latest.status === "NO_SHOW")) {
      lastStay = formatDateOnly(latest.checkOut);
    } else if (latest) {
      lastStay = formatDateOnly(latest.checkIn);
    }
    return {
      id: guest.id,
      name: `${guest.firstName} ${guest.lastName}`.trim(),
      email: guest.email ?? "",
      phone: guest.phone,
      country: guest.country,
      reservations: guest._count.reservations,
      lastStay,
      createdAt: guest.createdAt.toISOString(),
    };
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Guests</h1>
        <p className="mt-0.5 text-sm text-stone-500">
          Everyone who has stayed or booked with the hotel.
        </p>
      </div>

      <GuestsToolbar />

      <GuestsTable
        guests={rows}
        page={query.page}
        pageSize={query.pageSize}
        total={total}
        totalPages={totalPages}
      />
    </div>
  );
}
