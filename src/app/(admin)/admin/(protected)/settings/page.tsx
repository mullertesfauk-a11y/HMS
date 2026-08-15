import { SettingsForm } from "@/components/admin/settings/settings-form";
import { Card, CardContent } from "@/components/ui/card";
import { requirePermissionPage } from "@/lib/permissions";
import { hotelService } from "@/server/services/hotel.service";

export default async function SettingsPage() {
  await requirePermissionPage("settings.read");
  const hotel = await hotelService.getDefaultHotel();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Settings</h1>
        <p className="mt-0.5 text-sm text-stone-500">
          Hotel information and operational defaults. Admin only.
        </p>
      </div>

      <Card>
        <CardContent>
          <SettingsForm
            settings={{
              name: hotel.name,
              description: hotel.description,
              address: hotel.address,
              city: hotel.city,
              country: hotel.country,
              phone: hotel.phone,
              email: hotel.email,
              currency: hotel.currency,
              timezone: hotel.timezone,
              checkInTime: hotel.checkInTime,
              checkOutTime: hotel.checkOutTime,
              taxRate: hotel.taxRate.toNumber(),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
