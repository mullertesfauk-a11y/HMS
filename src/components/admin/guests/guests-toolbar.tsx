"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GuestsToolbar() {
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

  function handleSearchChange(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set("search", value);
      else params.delete("search");
      params.delete("page");
      router.replace(`${pathname}?${params.toString()}`);
    }, 300);
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-64">
        <label htmlFor="guest-search" className="sr-only">
          Search guests
        </label>
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
          />
          <Input
            id="guest-search"
            type="search"
            placeholder="Search name, email, or phone…"
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {searchParams.get("search") ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.replace(pathname)}
          className="text-stone-500"
        >
          <X aria-hidden className="h-3.5 w-3.5" />
          Clear
        </Button>
      ) : null}
    </div>
  );
}
