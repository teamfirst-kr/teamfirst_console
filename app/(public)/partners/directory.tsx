"use client";

import { useState } from "react";

import { Reveal } from "@/components/reveal";
import { PARTNER_CATEGORIES } from "@/lib/schemas/partner-application";

const CATEGORY_LABEL = Object.fromEntries(
  PARTNER_CATEGORIES.map((c) => [c.value, c.label]),
);

const GROUPS: { key: string; label: string; cats: string[] }[] = [
  { key: "all", label: "전체", cats: [] },
  { key: "performance", label: "퍼포먼스", cats: ["naver", "kakao", "google", "meta", "tiktok", "network"] },
  { key: "viral", label: "바이럴·인플루언서", cats: ["viral", "influencer"] },
  { key: "content", label: "콘텐츠·숏폼", cats: ["shortform"] },
  { key: "etc", label: "언론·옥외", cats: ["press", "ooh"] },
];

// 카테고리 중 하이라이트(파랑)로 강조할 핵심 매체
const HL_CATS = new Set(["naver", "kakao", "google", "meta", "viral", "influencer", "shortform"]);

const AVATAR_COLORS = [
  "#111E38", "#1e40af", "#7c3aed", "#dc2626", "#0369a1",
  "#b45309", "#0f766e", "#4338ca", "#c026d3", "#ea580c",
  "#334155", "#9333ea", "#0891b2", "#be123c",
];

export type DirectoryPartner = {
  id: string;
  company_name: string;
  specialty: string | null;
  staff_size: string | null;
  intro: string | null;
  categories: string[];
  kpis: string[];
  reportCycles: string[];
  tools: string[];
  performanceBased: boolean;
};

function initial(name: string): string {
  return name.replace(/[^가-힣A-Za-z0-9]/g, "").slice(0, 2) || "TF";
}
function cleanTool(t: string): string {
  return t.split("(")[0].trim();
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
    <div className="overflow-hidden">
      {/* 히어로 */}
      <section className="tf-hero-spotlight bg-secondary text-secondary-foreground">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center md:py-24">
          <Reveal className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">
            VERIFIED PARTNER AGENCIES
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.02em] md:text-4xl">
              팀퍼스트 파트너 대행사
            </h1>
          </Reveal>
          <Reveal delay={140}>
            <p className="mx-auto mt-4 max-w-xl text-sm text-white/70">
              엄격한 입점기준을 통과한 검증된 마케팅 파트너만 소속되어 있습니다.
            </p>
          </Reveal>
          <Reveal delay={200} className="mt-7 flex flex-wrap justify-center gap-2">
            {["전문 분야 검증", "포트폴리오 검증", "계약서 체결"].map((b) => (
              <span
                key={b}
                className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs"
              >
                ✓ {b}
              </span>
            ))}
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 py-14">
        {/* 필터 */}
        <div className="flex flex-wrap justify-center gap-2">
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
        <div className="mt-8 space-y-5">
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              해당 분야의 파트너가 아직 없습니다.
            </p>
          ) : (
            filtered.map((p, idx) => {
              const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              const tools = p.tools
                .map(cleanTool)
                .filter((t) => t && !t.includes("해당없음"));
              return (
                <Reveal key={p.id} delay={(idx % 6) * 50}>
                  <article className="overflow-hidden rounded-2xl border bg-card shadow-sm transition duration-300 hover:border-primary/40 hover:shadow-md">
                    {/* 헤더 */}
                    <div className="flex items-start gap-4 border-b p-5 sm:p-6">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-black tracking-tight text-white"
                        style={{ backgroundColor: color }}
                      >
                        {initial(p.company_name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[17px] font-extrabold text-foreground">
                            {p.company_name}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600">
                            ✓ Verified
                          </span>
                        </div>
                        {p.specialty ? (
                          <p className="mt-0.5 text-sm font-medium text-primary">
                            {p.specialty}
                          </p>
                        ) : null}
                        {p.staff_size ? (
                          <p className="text-xs text-muted-foreground">
                            {p.staff_size}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {/* 본문 */}
                    <div className="p-5 sm:p-6">
                      {p.intro ? (
                        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                          {p.intro}
                        </p>
                      ) : null}

                      {/* 매체 태그 */}
                      {p.categories.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {p.categories.map((c) => (
                            <span
                              key={c}
                              className={
                                "rounded-md border px-2 py-1 text-xs font-medium " +
                                (HL_CATS.has(c)
                                  ? "border-blue-200 bg-blue-50 text-primary"
                                  : "border-border bg-muted/50 text-muted-foreground")
                              }
                            >
                              {CATEGORY_LABEL[c] ?? c}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      {/* 서브카드: 핵심 KPI / 리포트 */}
                      {(p.kpis.length > 0 || p.reportCycles.length > 0) ? (
                        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                          {p.kpis.length > 0 ? (
                            <StatCard label="핵심 KPI" value={p.kpis.slice(0, 4).join(" · ")} />
                          ) : null}
                          {p.reportCycles.length > 0 ? (
                            <StatCard label="리포트" value={p.reportCycles.join(" · ")} />
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    {/* 풋터: 운영 툴 */}
                    {(tools.length > 0 || p.performanceBased) ? (
                      <div className="flex flex-wrap items-center gap-2 border-t bg-muted/30 px-5 py-3.5 sm:px-6">
                        {tools.slice(0, 5).map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {t}
                          </span>
                        ))}
                        {p.performanceBased ? (
                          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary">
                            CPA 가능
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                </Reveal>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/50 px-3.5 py-3">
      <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-[13px] font-semibold leading-snug text-foreground">
        {value}
      </div>
    </div>
  );
}
