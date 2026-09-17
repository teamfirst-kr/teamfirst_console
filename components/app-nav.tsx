"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export type AppNavItem = { href: string; label: string };
// 그룹: label이 있으면 서비스 구분 소제목으로 표시 (예: 광고비 페이백 / 대행사 매칭)
export type AppNavGroup = { label?: string; items: AppNavItem[] };

export function isNavGroups(nav: AppNavItem[] | AppNavGroup[]): nav is AppNavGroup[] {
  return nav.length > 0 && "items" in nav[0];
}

// 사이드바 내비: 현재 경로와 일치하는 메뉴를 강조 (usePathname 필요 → 클라이언트)
export function AppNav({ items }: { items: AppNavItem[] | AppNavGroup[] }) {
  const pathname = usePathname();
  const groups: AppNavGroup[] = isNavGroups(items) ? items : [{ items }];
  const flat = groups.flatMap((g) => g.items);

  // 최장 일치 항목만 활성화 (예: /admin/payback 과 /admin/payback/settlements 가 동시에 켜지지 않게)
  const best = flat
    .filter((i) => pathname === i.href || pathname.startsWith(`${i.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <nav className="flex-1 overflow-y-auto px-3">
      {groups.map((g, gi) => (
        <div key={g.label ?? `g${gi}`} className={gi > 0 ? "mt-4" : undefined}>
          {g.label ? (
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">{g.label}</p>
          ) : null}
          <div className="space-y-0.5">
            {g.items.map((item) => {
              const active = best?.href === item.href;
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
          </div>
        </div>
      ))}
    </nav>
  );
}
