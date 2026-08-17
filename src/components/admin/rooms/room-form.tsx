"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { createRoom, updateRoom } from "@/app/(admin)/admin/(protected)/rooms/actions";

// ──────────────────────────────────────────────────────────────────────────────
// Shared inner form (used in both dialog and standalone page mode)
// ──────────────────────────────────────────────────────────────────────────────

export function RoomForm({
  roomTypes,
  room,
  /** If provided, submit redirects to /admin/rooms (standalone page behaviour). */
  redirectOnSuccess = true,
  /** Called after a successful submit in dialog mode. */
  onSuccess,
  onCancel,
}: {
  roomTypes: { id: string; name: string }[];
  room?: {
    id: string;
    roomNumber: string;
    roomTypeId: string;
    floor: number | null;
    status: string;
  };
  redirectOnSuccess?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [roomTypeId, setRoomTypeId] = useState(room?.roomTypeId ?? roomTypes[0]?.id ?? "");
  const [roomNumber, setRoomNumber] = useState(room?.roomNumber ?? "");
  const [floor, setFloor] = useState(
    room?.floor !== null && room?.floor !== undefined ? String(room.floor) : "",
  );
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
      if (onSuccess) {
        onSuccess();
      } else if (redirectOnSuccess) {
        router.push("/admin/rooms");
        router.refresh();
      }
    });
  }

  return (
    <form id="room-form" onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
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
        </div>

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

        <div className="sm:col-span-2">
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
        </div>
      </div>

      {error ? (
        <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {error}
        </p>
      ) : null}

      {/* Footer only rendered in standalone page mode */}
      {!onSuccess && !onCancel ? (
        <div className="flex gap-2 pt-2">
          <Button type="submit" loading={pending}>
            {room ? "Save changes" : "Create room"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.push("/admin/rooms")}>
            Cancel
          </Button>
        </div>
      ) : null}
    </form>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Dialog wrapper
// ──────────────────────────────────────────────────────────────────────────────

export function RoomDialog({
  open,
  onOpenChange,
  roomTypes,
  room,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
  const [floor, setFloor] = useState(
    room?.floor !== null && room?.floor !== undefined ? String(room.floor) : "",
  );
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
      onOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={room ? `Edit Room ${room.roomNumber}` : "New Room"}
      description="Add a physical room to the hotel inventory."
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="room-dialog-form" loading={pending}>
            {room ? "Save Changes" : "Create Room"}
          </Button>
        </>
      }
    >
      <form id="room-dialog-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
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
          </div>

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

          <div className="sm:col-span-2">
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
          </div>
        </div>

        {error ? (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </p>
        ) : null}
      </form>
    </Dialog>
  );
}
