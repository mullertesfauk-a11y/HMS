"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export interface StaffFilterOptions {
  roles: string[];
  statuses: string[];
}

export function StaffToolbar({ options }: { options: StaffFilterOptions }) {
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

  const hasFilters = ["search", "role", "status"].some((key) => searchParams.get(key));

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-64">
        <label htmlFor="staff-search" className="sr-only">
          Search staff
        </label>
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
          />
          <Input
            id="staff-search"
            type="search"
            placeholder="Search name or email…"
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Select
        aria-label="Filter by role"
        value={searchParams.get("role") ?? ""}
        onChange={(event) =>
          updateParams((params) => {
            if (event.target.value) params.set("role", event.target.value);
            else params.delete("role");
          })
        }
        className="w-36"
      >
        <option value="">All roles</option>
        {options.roles.map((role) => (
          <option key={role} value={role}>
            {role.charAt(0) + role.slice(1).toLowerCase()}
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
            {status.charAt(0) + status.slice(1).toLowerCase()}
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
    </div>
  );
}
