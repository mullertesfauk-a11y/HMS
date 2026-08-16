"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createRoomType, updateRoomType } from "@/app/(admin)/admin/(protected)/room-types/actions";

export function RoomTypeForm({
  amenities,
  roomType,
}: {
  amenities: { id: string; name: string }[];
  roomType?: {
    id: string;
    name: string;
    description: string | null;
    capacity: number;
    maxAdults: number;
    maxChildren: number;
    bedType: string;
    size: string | null;
    imageUrl: string | null;
    basePrice: number;
    status: string;
    amenityIds: string[];
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(roomType?.name ?? "");
  const [description, setDescription] = useState(roomType?.description ?? "");
  const [capacity, setCapacity] = useState(roomType ? String(roomType.capacity) : "2");
  const [maxAdults, setMaxAdults] = useState(roomType ? String(roomType.maxAdults) : "2");
  const [maxChildren, setMaxChildren] = useState(roomType ? String(roomType.maxChildren) : "1");
  const [bedType, setBedType] = useState(roomType?.bedType ?? "");
  const [size, setSize] = useState(roomType?.size ?? "");
  const [imageUrl, setImageUrl] = useState(roomType?.imageUrl ?? "");
  const [basePrice, setBasePrice] = useState(roomType ? String(roomType.basePrice) : "");
  const [status, setStatus] = useState(roomType?.status ?? "ACTIVE");
  const [amenityIds, setAmenityIds] = useState<string[]>(roomType?.amenityIds ?? []);

  function toggleAmenity(id: string) {
    setAmenityIds((current) =>
      current.includes(id) ? current.filter((amenityId) => amenityId !== id) : [...current, id],
    );
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const capacityNum = Number(capacity);
    const adultsNum = Number(maxAdults);
    const childrenNum = Number(maxChildren);
    const priceNum = Number(basePrice);
    if (!name.trim() || !bedType.trim() || !basePrice || !capacityNum) {
      setError("Name, bed type, capacity, and base price are required");
      return;
    }
    if (priceNum <= 0) {
      setError("Base price must be positive");
      return;
    }

    startTransition(async () => {
      const input = {
        name: name.trim(),
        description: description.trim() || undefined,
        capacity: capacityNum,
        maxAdults: adultsNum || capacityNum,
        maxChildren: childrenNum,
        bedType: bedType.trim(),
        size: size.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        basePrice: priceNum,
        status: status as "ACTIVE" | "INACTIVE",
        amenityIds: amenityIds.length > 0 ? amenityIds : undefined,
      };
      const result = roomType ? await updateRoomType(roomType.id, input) : await createRoomType(input);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/admin/room-types");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="name"
          label="Name"
          placeholder="e.g. Deluxe Room"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <Input
          name="bedType"
          label="Bed type"
          placeholder="e.g. King bed"
          value={bedType}
          onChange={(event) => setBedType(event.target.value)}
          required
        />
        <Input
          name="capacity"
          label="Total capacity"
          type="number"
          min={1}
          max={50}
          value={capacity}
          onChange={(event) => setCapacity(event.target.value)}
          required
        />
        <Input
          name="maxAdults"
          label="Max adults"
          type="number"
          min={1}
          max={50}
          value={maxAdults}
          onChange={(event) => setMaxAdults(event.target.value)}
        />
        <Input
          name="maxChildren"
          label="Max children"
          type="number"
          min={0}
          max={50}
          value={maxChildren}
          onChange={(event) => setMaxChildren(event.target.value)}
        />
        <Input
          name="size"
          label="Size"
          placeholder="e.g. 32 m²"
          value={size}
          onChange={(event) => setSize(event.target.value)}
        />
        <Input
          name="imageUrl"
          label="Image URL"
          type="url"
          placeholder="https://images.unsplash.com/…"
          value={imageUrl}
          onChange={(event) => setImageUrl(event.target.value)}
        />
        <Input
          name="basePrice"
          label="Base price per night"
          type="number"
          min={0}
          step="0.01"
          placeholder="e.g. 4800"
          value={basePrice}
          onChange={(event) => setBasePrice(event.target.value)}
          required
        />
        <Select
          name="status"
          label="Status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="ACTIVE">Active (bookable)</option>
          <option value="INACTIVE">Inactive</option>
        </Select>
      </div>

      <Textarea
        name="description"
        label="Description"
        rows={4}
        placeholder="Describe the room…"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
      />

      <fieldset>
        <legend className="text-sm font-medium text-stone-700">Amenities</legend>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">
          {amenities.map((amenity) => (
            <Checkbox
              key={amenity.id}
              name="amenities"
              checked={amenityIds.includes(amenity.id)}
              onChange={() => toggleAmenity(amenity.id)}
              label={amenity.name}
            />
          ))}
        </div>
      </fieldset>

      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={pending}>
          {roomType ? "Save changes" : "Create room type"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/room-types")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
