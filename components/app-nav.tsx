"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export type AppNavItem = { href: string; label: string };

// 사이드바 내비: 현재 경로와 일치하는 메뉴를 강조 (usePathname 필요 → 클라이언트)
export function AppNav({ items }: { items: AppNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 px-3 space-y-1">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "block rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-white/10 font-medium text-white shadow-[inset_2px_0_0_0_theme(colors.sky.400)]"
                : "text-white/80 hover:bg-white/10 hover:text-white",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
