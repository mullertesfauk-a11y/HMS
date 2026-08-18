"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, LogIn, LogOut, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ConfirmationDialog } from "@/components/ui/dialog";
import {
  assignRoomToReservation,
  cancelReservation,
  checkInReservation,
  checkOutReservation,
  confirmReservation,
} from "@/app/(admin)/admin/(protected)/reservations/actions";

const ACTION_LABELS: Record<string, string> = {
  "reservation.confirmed": "Confirmed",
  "reservation.cancelled": "Cancelled",
  "reservation.checked_in": "Checked in",
  "reservation.checked_out": "Checked out",
};

/**
 * State-based action buttons for the reservation detail page header. Server
 * actions perform the transition (permission + state machine + audit); this
 * component only reflects pending state and surfaces errors.
 */
export function ReservationActions({
  reservationId,
  status,
}: {
  reservationId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  function run(action: () => Promise<{ ok: true }>, successKey: string) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        await action();
        setNotice(ACTION_LABELS[successKey] ?? "Updated");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Something went wrong");
      }
    });
  }

  const cancellable = status === "PENDING" || status === "CONFIRMED";
  const canCheckIn = status === "CONFIRMED";
  const canCheckOut = status === "CHECKED_IN";

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {canCheckIn ? (
          <Button
            size="sm"
            loading={pending}
            onClick={() => run(() => checkInReservation(reservationId), "reservation.checked_in")}
          >
            <LogIn aria-hidden className="h-4 w-4" />
            Check in
          </Button>
        ) : null}

        {canCheckOut ? (
          <Button
            size="sm"
            loading={pending}
            onClick={() => run(() => checkOutReservation(reservationId), "reservation.checked_out")}
          >
            <LogOut aria-hidden className="h-4 w-4" />
            Check out
          </Button>
        ) : null}

        {status === "PENDING" ? (
          <Button
            size="sm"
            variant="secondary"
            loading={pending}
            onClick={() => run(() => confirmReservation(reservationId), "reservation.confirmed")}
          >
            <CheckCircle2 aria-hidden className="h-4 w-4" />
            Confirm
          </Button>
        ) : null}

        {cancellable ? (
          <Button
            size="sm"
            variant="dangerGhost"
            loading={pending}
            onClick={() => setConfirmCancelOpen(true)}
          >
            <XCircle aria-hidden className="h-4 w-4" />
            Cancel
          </Button>
        ) : null}
      </div>

      {notice ? (
        <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {notice}.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <ConfirmationDialog
        open={confirmCancelOpen}
        onOpenChange={setConfirmCancelOpen}
        title="Cancel this reservation?"
        description="The stay dates will be freed for other guests. This action cannot be undone."
        confirmLabel="Cancel reservation"
        destructive
        loading={pending}
        onConfirm={() => {
          setConfirmCancelOpen(false);
          run(() => cancelReservation(reservationId), "reservation.cancelled");
        }}
      />
    </div>
  );
}

/**
 * Room assignment control for the reservation detail page. Only rendered when
 * the reservation can still be assigned a room (PENDING / CONFIRMED).
 */
export function RoomAssignment({
  reservationId,
  roomTypeId,
  canAssign,
  assignableRooms,
  assignedRoomId,
}: {
  reservationId: string;
  roomTypeId: string | null;
  canAssign: boolean;
  /** Physical rooms of the reserved type that are free for the stay. */
  assignableRooms: { id: string; roomNumber: string; floor: number | null }[];
  assignedRoomId: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState("");

  if (!canAssign || !roomTypeId) return null;

  const freeRooms = assignableRooms.filter((room) => room.id !== assignedRoomId);

  if (freeRooms.length === 0) {
    return (
      <p className="text-xs text-slate-500">
        {assignedRoomId
          ? "No other rooms of this type are free for the stay."
          : "No rooms of this type are free for the stay."}
      </p>
    );
  }

  function assign() {
    if (!selectedRoomId) return;
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        await assignRoomToReservation(reservationId, selectedRoomId);
        setNotice("Room assigned");
        setSelectedRoomId("");
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Something went wrong");
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <Select
          id="assign-room"
          aria-label="Assign a room"
          value={selectedRoomId}
          onChange={(event) => setSelectedRoomId(event.target.value)}
          className="h-9"
        >
          <option value="">Assign a room…</option>
          {freeRooms.map((room) => (
            <option key={room.id} value={room.id}>
              Room {room.roomNumber} · Floor {room.floor}
            </option>
          ))}
        </Select>
        <Button
          size="sm"
          variant="secondary"
          disabled={!selectedRoomId || pending}
          loading={pending}
          onClick={assign}
        >
          Assign
        </Button>
      </div>

      {notice ? (
        <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {notice}.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
