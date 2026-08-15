"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, LogIn, LogOut, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
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
 * State-based action buttons for the reservation detail page. Server actions
 * perform the transition (permission + state machine + audit); this component
 * only reflects pending state and surfaces errors.
 */
export function ReservationActions({
  reservationId,
  status,
  roomTypeId,
  assignableRooms,
  assignedRoomId,
}: {
  reservationId: string;
  status: string;
  roomTypeId: string | null;
  assignableRooms: { id: string; roomNumber: string; floor: number | null }[];
  assignedRoomId: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState("");

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
  const canAssignRoom = (status === "PENDING" || status === "CONFIRMED") && Boolean(roomTypeId);
  const freeRooms =
    canAssignRoom && roomTypeId
      ? assignableRooms.filter((room) => room.id !== assignedRoomId)
      : [];

  return (
    <div className="space-y-2">
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
            Cancel reservation
          </Button>
        ) : null}
      </div>

      {canAssignRoom ? (
        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="assign-room" className="text-sm font-medium text-stone-700">
              Assign room
            </label>
            <select
              id="assign-room"
              value={selectedRoomId}
              onChange={(event) => setSelectedRoomId(event.target.value)}
              className="h-9 w-full appearance-none rounded-md border border-stone-300 bg-white px-3 pr-8 text-sm text-foreground focus:border-brand focus:outline-none"
            >
              <option value="">
                {assignedRoomId ? `Keep room assignment` : "Select a room…"}
              </option>
              {freeRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  Room {room.roomNumber} · Floor {room.floor}
                </option>
              ))}
            </select>
          </div>
          <Button
            size="sm"
            variant="secondary"
            disabled={!selectedRoomId || pending}
            loading={pending}
            onClick={() =>
              run(() => assignRoomToReservation(reservationId, selectedRoomId), "Updated")
            }
          >
            Assign
          </Button>
        </div>
      ) : null}

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
