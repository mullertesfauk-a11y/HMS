"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateSettings } from "@/app/(admin)/admin/(protected)/settings/actions";

export function SettingsForm({
  settings,
}: {
  settings: {
    name: string;
    description: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    phone: string | null;
    email: string | null;
    currency: string;
    timezone: string;
    checkInTime: string;
    checkOutTime: string;
    taxRate: number;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState(settings.name);
  const [description, setDescription] = useState(settings.description ?? "");
  const [address, setAddress] = useState(settings.address ?? "");
  const [city, setCity] = useState(settings.city ?? "");
  const [country, setCountry] = useState(settings.country ?? "");
  const [phone, setPhone] = useState(settings.phone ?? "");
  const [email, setEmail] = useState(settings.email ?? "");
  const [checkInTime, setCheckInTime] = useState(settings.checkInTime);
  const [checkOutTime, setCheckOutTime] = useState(settings.checkOutTime);
  const [taxRate, setTaxRate] = useState(String(settings.taxRate));

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateSettings({
        name: name.trim() || undefined,
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        checkInTime: checkInTime || undefined,
        checkOutTime: checkOutTime || undefined,
        taxRate: taxRate === "" ? undefined : Number(taxRate),
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="name"
          label="Hotel name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          name="phone"
          label="Phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
        <Input
          name="email"
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          name="address"
          label="Address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />
        <Input
          name="city"
          label="City"
          value={city}
          onChange={(event) => setCity(event.target.value)}
        />
        <Input
          name="country"
          label="Country"
          value={country}
          onChange={(event) => setCountry(event.target.value)}
        />
      </div>

      <Textarea
        name="description"
        label="Description"
        rows={3}
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          name="checkInTime"
          label="Check-in time"
          type="time"
          value={checkInTime}
          onChange={(event) => setCheckInTime(event.target.value)}
        />
        <Input
          name="checkOutTime"
          label="Check-out time"
          type="time"
          value={checkOutTime}
          onChange={(event) => setCheckOutTime(event.target.value)}
        />
        <Input
          name="taxRate"
          label="Tax rate (%)"
          type="number"
          min={0}
          max={100}
          step="0.01"
          value={taxRate}
          onChange={(event) => setTaxRate(event.target.value)}
        />
      </div>

      <div className="rounded-md bg-stone-50 px-4 py-3 text-sm text-stone-600">
        <p>
          <span className="font-medium text-stone-700">Currency:</span> {settings.currency} ·{" "}
          <span className="font-medium text-stone-700">Timezone:</span> {settings.timezone}
        </p>
        <p className="mt-1 text-xs text-stone-500">
          Currency and timezone are fixed in the MVP — changing them would
          corrupt existing reservation values.
        </p>
      </div>

      {saved ? (
        <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Settings saved.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={pending}>
          Save settings
        </Button>
      </div>
    </form>
  );
}
