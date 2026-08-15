"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export interface ReservationFilterOptions {
  statuses: string[];
  paymentStatuses: string[];
  roomTypes: { id: string; name: string }[];
}

/**
 * Filter bar for the reservations table. Every change updates the URL search
 * params so the server component re-fetches — one source of truth, and the
 * filters stay shareable/bookmarkable.
 */
export function ReservationToolbar({ options }: { options: ReservationFilterOptions }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function updateParams(update: (params: URLSearchParams) => void) {
    const params = new URLSearchParams(searchParams.toString());
    update(params);
    // Any filter change resets pagination.
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

  const hasFilters = ["search", "status", "paymentStatus", "roomTypeId", "checkInFrom", "checkInTo"].some(
    (key) => searchParams.get(key),
  );

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-64">
        <label htmlFor="res-search" className="sr-only">
          Search reservations
        </label>
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            id="res-search"
            type="search"
            placeholder="Search name, email, #"
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            className="pl-9"
          />
        </div>
      </div>

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

      <Select
        aria-label="Filter by payment status"
        value={searchParams.get("paymentStatus") ?? ""}
        onChange={(event) =>
          updateParams((params) => {
            if (event.target.value) params.set("paymentStatus", event.target.value);
            else params.delete("paymentStatus");
          })
        }
        className="w-44"
      >
        <option value="">All payments</option>
        {options.paymentStatuses.map((status) => (
          <option key={status} value={status}>
            {status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ")}
          </option>
        ))}
      </Select>

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

      <div className="flex items-center gap-2">
        <Input
          aria-label="Check-in from"
          type="date"
          value={searchParams.get("checkInFrom") ?? ""}
          onChange={(event) =>
            updateParams((params) => {
              if (event.target.value) params.set("checkInFrom", event.target.value);
              else params.delete("checkInFrom");
            })
          }
          className="w-40"
        />
        <span className="text-stone-400" aria-hidden>
          –
        </span>
        <Input
          aria-label="Check-in to"
          type="date"
          value={searchParams.get("checkInTo") ?? ""}
          onChange={(event) =>
            updateParams((params) => {
              if (event.target.value) params.set("checkInTo", event.target.value);
              else params.delete("checkInTo");
            })
          }
          className="w-40"
        />
      </div>

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
    </div>
  );
}
