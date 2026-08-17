"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { RoomDialog } from "@/components/admin/rooms/room-form";

export interface RoomsFilterOptions {
  statuses: string[];
  roomTypes: { id: string; name: string }[];
  floors: number[];
}

export function RoomsToolbar({ options }: { options: RoomsFilterOptions }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [dialogOpen, setDialogOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function updateParams(update: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    update(params);
    params.delete("page");
    router.replace(`${pathname}?${params.toString()}`);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams((params) => {
        if (value) params.set("search", value);
        else params.delete("search");
      });
    }, 300);
  }

  const hasFilters = ["search", "status", "roomTypeId", "floor"].some((key) =>
    searchParams.get(key),
  );

  return (
    <>
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-56">
          <label htmlFor="room-search" className="sr-only">
            Search rooms
          </label>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
            />
            <Input
              id="room-search"
              type="search"
              placeholder="Room number…"
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Select
          aria-label="Filter by room type"
          value={searchParams.get("roomTypeId") ?? ""}
          onChange={(event) =>
            updateParams((params) => {
              if (event.target.value) params.set("roomTypeId", event.target.value);
              else params.delete("roomTypeId");
            })
          }
          className="w-48"
        >
          <option value="">All room types</option>
          {options.roomTypes.map((roomType) => (
            <option key={roomType.id} value={roomType.id}>
              {roomType.name}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Filter by floor"
          value={searchParams.get("floor") ?? ""}
          onChange={(event) =>
            updateParams((params) => {
              if (event.target.value) params.set("floor", event.target.value);
              else params.delete("floor");
            })
          }
          className="w-32"
        >
          <option value="">All floors</option>
          {options.floors.map((floor) => (
            <option key={floor} value={floor}>
              Floor {floor}
            </option>
          ))}
        </Select>

        <Select
          aria-label="Filter by status"
          value={searchParams.get("status") ?? ""}
          onChange={(event) =>
            updateParams((params) => {
              if (event.target.value) params.set("status", event.target.value);
              else params.delete("status");
            })
          }
          className="w-40"
        >
          <option value="">All statuses</option>
          {options.statuses.map((status) => (
            <option key={status} value={status}>
              {status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ")}
            </option>
          ))}
        </Select>

        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.replace(pathname)}
            className="text-stone-500"
          >
            <X aria-hidden className="h-3.5 w-3.5" />
            Clear filters
          </Button>
        ) : null}

        {/* Spacer to push New Room button to the right */}
        <div className="flex-1" />

        <Button onClick={() => setDialogOpen(true)}>
          <Plus aria-hidden className="h-4 w-4" />
          New Room
        </Button>
      </div>

      <RoomDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        roomTypes={options.roomTypes}
      />
    </>
  );
}
