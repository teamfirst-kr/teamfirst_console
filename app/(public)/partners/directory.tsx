"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { PARTNER_CATEGORIES } from "@/lib/schemas/partner-application";

const CATEGORY_LABEL = Object.fromEntries(PARTNER_CATEGORIES.map((c) => [c.value, c.label]));

const GROUPS: { key: string; label: string; cats: string[] }[] = [
  { key: "all", label: "전체", cats: [] },
  { key: "performance", label: "퍼포먼스", cats: ["naver", "kakao", "google", "meta", "tiktok", "network"] },
  { key: "viral", label: "바이럴·인플루언서", cats: ["viral", "influencer"] },
  { key: "content", label: "콘텐츠·숏폼", cats: ["shortform"] },
  { key: "etc", label: "언론·옥외", cats: ["press", "ooh"] },
];

export type DirectoryPartner = {
  id: string;
  company_name: string;
  specialty: string | null;
  staff_size: string | null;
  intro: string | null;
  categories: string[];
  kpis: string[];
};

function initial(name: string): string {
  return name.replace(/[^가-힣A-Za-z0-9]/g, "").slice(0, 2) || "TF";
}

export function PartnerDirectory({ partners }: { partners: DirectoryPartner[] }) {
  const [group, setGroup] = useState("all");

  const filtered =
    group === "all"
      ? partners
      : partners.filter((p) => {
          const cats = GROUPS.find((g) => g.key === group)?.cats ?? [];
          return p.categories.some((c) => cats.includes(c));
        });

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="text-center space-y-3">
        <Badge variant="default">VERIFIED PARTNER AGENCIES</Badge>
        <h1 className="text-3xl font-bold text-secondary">팀퍼스트 파트너 대행사</h1>
        <p className="text-sm text-muted-foreground">
          엄격한 입점기준을 통과한 검증된 마케팅 파트너만 소속되어 있습니다.
        </p>
      </div>

      {/* 입점기준 배너 */}
      <div className="mt-8 rounded-xl bg-secondary p-6 text-secondary-foreground flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-bold">입점 검증 완료 대행사만 노출됩니다.</p>
          <p className="mt-1 text-sm text-white/60">
            전문 카테고리 보유 · 포트폴리오 검증 · 계약서 체결 완료
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["전문 분야 검증", "포트폴리오 검증", "계약서 체결"].map((b) => (
            <span
              key={b}
              className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs"
            >
              ✓ {b}
            </span>
          ))}
        </div>
      </div>

      {/* 필터 */}
      <div className="mt-8 flex flex-wrap gap-2">
        {GROUPS.map((g) => (
          <button
            key={g.key}
            onClick={() => setGroup(g.key)}
            className={
              group === g.key
                ? "rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground"
                : "rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary"
            }
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* 카드 */}
      <div className="mt-6 space-y-4">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            해당 분야의 파트너가 아직 없습니다.
          </p>
        ) : (
          filtered.map((p) => (
            <div key={p.id} className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-lg font-bold text-secondary-foreground">
                  {initial(p.company_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-foreground">
                      {p.company_name}
                    </span>
                    <Badge variant="success">✓ Verified</Badge>
                  </div>
                  {p.specialty ? (
                    <p className="text-sm text-primary">{p.specialty}</p>
                  ) : null}
                  {p.staff_size ? (
                    <p className="text-xs text-muted-foreground">{p.staff_size}</p>
                  ) : null}
                </div>
              </div>

              {p.intro ? (
                <p className="mt-4 line-clamp-3 text-sm text-muted-foreground leading-relaxed">
                  {p.intro}
                </p>
              ) : null}

              {p.categories.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {p.categories.map((c) => (
                    <Badge key={c} variant="muted">
                      {CATEGORY_LABEL[c] ?? c}
                    </Badge>
                  ))}
                </div>
              ) : null}

              {p.kpis.length > 0 ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  핵심 KPI · {p.kpis.join(" · ")}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
