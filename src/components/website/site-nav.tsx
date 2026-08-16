"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export interface NavItem {
  href: string;
  label: string;
}

const DEFAULT_NAV: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/rooms", label: "Rooms" },
  { href: "/menu", label: "Restaurant" },
  { href: "/reservation/lookup", label: "Find my booking" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function SiteNav({
  nav = DEFAULT_NAV,
  className,
}: {
  nav?: NavItem[];
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className={className}>
      {nav.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(pathname, item.href) ? "page" : undefined}
          className={cn(
            "text-sm font-medium uppercase tracking-widest transition-colors hover:text-brand",
            isActive(pathname, item.href)
              ? "text-brand"
              : "text-stone-600",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
