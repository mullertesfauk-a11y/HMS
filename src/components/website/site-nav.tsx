"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils/cn";

export interface NavItem {
  href: string;
  label: string;
}

export function useNavItems(): NavItem[] {
  const t = useTranslations("nav");
  return [
    { href: "/", label: t("home") },
    { href: "/rooms", label: t("rooms") },
    { href: "/menu", label: t("restaurant") },
    { href: "/reservation/lookup", label: t("findBooking") },
  ];
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function SiteNav({
  nav,
  className,
}: {
  nav?: NavItem[];
  className?: string;
}) {
  const pathname = usePathname();
  const defaultNav = useNavItems();
  const navItems = nav ?? defaultNav;

  return (
    <nav aria-label="Main navigation" className={className}>
      {navItems.map((item) => (
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
