"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { createRoom, updateRoom } from "@/app/(admin)/admin/(protected)/rooms/actions";

export function RoomForm({
  roomTypes,
  room,
}: {
  roomTypes: { id: string; name: string }[];
  room?: {
    id: string;
    roomNumber: string;
    roomTypeId: string;
    floor: number | null;
    status: string;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [roomTypeId, setRoomTypeId] = useState(room?.roomTypeId ?? roomTypes[0]?.id ?? "");
  const [roomNumber, setRoomNumber] = useState(room?.roomNumber ?? "");
  const [floor, setFloor] = useState(room?.floor !== null && room?.floor !== undefined ? String(room.floor) : "");
  const [status, setStatus] = useState(room?.status ?? "AVAILABLE");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!roomTypeId || !roomNumber.trim()) {
      setError("Room type and room number are required");
      return;
    }
    startTransition(async () => {
      const input = {
        roomTypeId,
        roomNumber: roomNumber.trim(),
        floor: floor === "" ? undefined : Number(floor),
        status: status as "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "OUT_OF_SERVICE",
      };
      const result = room ? await updateRoom(room.id, input) : await createRoom(input);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/admin/rooms");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <Select
        name="roomTypeId"
        label="Room type"
        value={roomTypeId}
        onChange={(event) => setRoomTypeId(event.target.value)}
        required
      >
        {roomTypes.map((roomType) => (
          <option key={roomType.id} value={roomType.id}>
            {roomType.name}
          </option>
        ))}
      </Select>

      <Input
        name="roomNumber"
        label="Room number"
        placeholder="e.g. 204"
        value={roomNumber}
        onChange={(event) => setRoomNumber(event.target.value)}
        required
      />

      <Input
        name="floor"
        label="Floor"
        type="number"
        min={0}
        max={999}
        placeholder="e.g. 2"
        value={floor}
        onChange={(event) => setFloor(event.target.value)}
      />

      <Select
        name="status"
        label="Housekeeping status"
        value={status}
        onChange={(event) => setStatus(event.target.value)}
      >
        <option value="AVAILABLE">Available</option>
        <option value="OCCUPIED">Occupied</option>
        <option value="MAINTENANCE">Maintenance</option>
        <option value="OUT_OF_SERVICE">Out of service</option>
      </Select>

      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2 pt-2">
        <Button type="submit" loading={pending}>
          {room ? "Save changes" : "Create room"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/rooms")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
