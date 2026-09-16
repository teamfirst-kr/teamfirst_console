"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitQuickLead } from "@/app/(public)/apply/lead-actions";
import { trackConversion } from "@/components/analytics/track";
import {
  BUNDLE_DISCOUNT,
  CATCHLOG_EXTRA_PER_100K,
  CATCHLOG_MAX_PV,
  CATCHLOG_TIERS,
  CATCHLOG_TRIAL_DAYS,
  FIXED_PRICES,
  catchlogMonthly,
  quote,
  type Billing,
  type SolutionKey,
} from "@/lib/solution-pricing";

// 솔루션 구독 요금 빌더 — 3종 카드(선택) + 월간/연간 + 캐치로그 PV 구간 + 견적 요약 + 구독 문의(리드).
// 요금 계산은 lib/solution-pricing.ts 단일 모듈만 사용한다.

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
const manPv = (pv: number) => `월 ${Math.round(pv / 10_000)}만 PV`;

const PV_OPTIONS = Array.from(
  { length: CATCHLOG_MAX_PV / 100_000 },
  (_, i) => (i + 1) * 100_000,
);

const CATALOG: {
  key: SolutionKey;
  brand: string;
  name: string;
  tagline: string;
  features: string[];
}[] = [
  {
    key: "log",
    brand: "CatchLog",
    name: "로그분석 솔루션",
    tagline: "부정클릭 차단 + 사이트·채널 분석 + AI 진단 + 상담 챗봇",
    features: [
      "부정클릭 IP 탐지 · 네이버 노출 제한 원클릭 차단 (모바일 기기·통신사 추적)",
      "스마트스토어까지 추적용 URL로 광고 클릭·부정클릭 추적",
      "실시간 방문·유입·행동 분석, 신규/재방문·리텐션, 14일 기간 비교",
      "채널(직접·네이버·구글) · 요일·시간대별 유입 분석",
      "AI 사이트 분석: 유입→탐색→전환 비율, 랜딩페이지별 매출",
      "AI 성과 진단: ROAS 등락 원인, 브랜드/일반 키워드 분리, 누수 기회 진단",
      "네이버 검색광고 연동 (캠페인·키워드·광고비) · 전환·매출 추적 (카페24 주문 연동)",
      "히트맵 · 스크롤 분석 · 정기 리포트 메일 · 상담 챗봇",
    ],
  },
  {
    key: "report",
    brand: "AUTO REPORT",
    name: "자동리포트 솔루션",
    tagline: "광고시스템 ID만 연결하면 일·주·월 리포트가 메일로 도착",
    features: [
      "구매전환·캠페인별 비용·매출 대시보드, 지표 선택 추이 그래프",
      "캠페인 · 그룹 · 키워드 · PC/모바일 · 요일·시간대별 성과",
      "일간 / 주간 / 월간 / 맞춤 기간 리포트 (엑셀 다운로드)",
      "유형별(쇼핑·파워링크·브랜드검색·파워콘텐츠) · 쇼핑 검색어별 · 구매 시간대 표시",
      "월간 전월 대비 비교 · 이메일 자동 발송 스케줄 (본문에 요약 포함)",
      "커스텀 시트: 원하는 차원·지표 조합 추가",
      "성과 개선 전략: 증액(ROAS 유지/볼륨 성장) · 감액 · 원클릭 계정 분석 제안",
    ],
  },
  {
    key: "bid",
    brand: "AUTO BID",
    name: "자동 ROAS 최적화 솔루션",
    tagline: "목표 ROAS 기준 소재·키워드별 입찰가 자동 조정, 매출 볼륨은 보호",
    features: [
      "쇼핑검색(소재 ID별) · 파워링크(키워드별) 각각 최적화",
      "목표 ROAS 초과/미달 시 증액·감액 비율 규칙 (예: ±10%)",
      "볼륨 보호: 최근 4주 매출 대비 하락 시 감액 보류",
      "조정 제외 조건: 노출순위 · 최소 소진액 · 최저 입찰가 가드",
      "제품 분류별(일반·집중홍보) ROAS 계수·증감 비율 차등, 소재별 개별 목표",
      "원클릭 일괄 반영 · 첫 달 전문가 세팅",
    ],
  },
];

export function PricingBuilder() {
  const [billing, setBilling] = useState<Billing>("monthly");
  const [pv, setPv] = useState<number>(CATCHLOG_TIERS[0].pv);
  const [selected, setSelected] = useState<SolutionKey[]>(["log", "report", "bid"]);
  const [brand, setBrand] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const q = useMemo(() => quote(selected, billing, pv), [selected, billing, pv]);
  const unit = billing === "yearly" ? "연" : "월";

  function toggle(key: SolutionKey) {
    setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));
  }

  const valid =
    selected.length > 0 && brand.trim().length > 0 && phone.replace(/\D/g, "").length >= 9;

  async function submit() {
    if (busy || !valid || sent) return;
    setBusy(true);
    setErr(null);
    try {
      const keys = (["log", "report", "bid"] as SolutionKey[]).filter((k) => selected.includes(k));
      const source = `sub:${keys.join("+")}/${billing === "yearly" ? "Y" : "M"}${
        keys.includes("log") ? `/pv${Math.round(pv / 10_000)}` : ""
      }`;
      const res = await submitQuickLead({
        brand,
        phone,
        budget: q.total,
        source,
        label: "🧩 솔루션 구독 문의",
      });
      if (!res.ok) {
        setErr("접수에 실패했습니다. 잠시 후 다시 시도해주세요.");
        return;
      }
      setSent(true);
      trackConversion(
        "Purchase",
        { content_name: `solution_subscribe_${keys.join("_")}`, value: q.total, currency: "KRW" },
        "purchase",
      );
    } catch {
      setErr("접수에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <div className="space-y-6">
        {/* 결제 주기 */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">구독할 솔루션을 선택하세요. 2종 이상 선택 시 전체 금액이 할인됩니다.</p>
          <div className="inline-flex rounded-lg border bg-card p-1 text-sm font-medium">
            {(["monthly", "yearly"] as Billing[]).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBilling(b)}
                aria-pressed={billing === b}
                className={
                  "rounded-md px-3.5 py-1.5 transition-colors " +
                  (billing === b ? "bg-secondary text-white" : "text-muted-foreground hover:text-foreground")
                }
              >
                {b === "monthly" ? "월간 결제" : "연간 결제"}
              </button>
            ))}
          </div>
        </div>

        {/* 솔루션 카드 */}
        <div className="grid gap-4 md:grid-cols-3">
          {CATALOG.map((c) => {
            const on = selected.includes(c.key);
            const price =
              c.key === "log"
                ? catchlogMonthly(pv) * (billing === "yearly" ? 12 : 1)
                : FIXED_PRICES[c.key][billing];
            return (
              <div
                key={c.key}
                className={
                  "flex flex-col rounded-2xl border bg-card p-5 shadow-sm transition-colors " +
                  (on ? "border-secondary ring-2 ring-secondary/20" : "border-border")
                }
              >
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => toggle(c.key)}
                    className="mt-1 h-4 w-4 accent-[#111E38]"
                    aria-label={`${c.name} 선택`}
                  />
                  <span>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-primary">{c.brand}</span>
                    <span className="block text-lg font-extrabold text-secondary">{c.name}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{c.tagline}</span>
                  </span>
                </label>

                <div className="mt-4 border-t pt-4">
                  {c.key === "log" ? (
                    <>
                      <label className="block text-xs font-semibold text-muted-foreground" htmlFor="pv-select">
                        월 페이지뷰 (사이트 1개 기준 · 전 기능 포함)
                      </label>
                      <select
                        id="pv-select"
                        value={pv}
                        onChange={(e) => setPv(Number(e.target.value))}
                        className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm"
                      >
                        {PV_OPTIONS.map((p) => (
                          <option key={p} value={p}>
                            {manPv(p)} — 월 {won(catchlogMonthly(p))}
                          </option>
                        ))}
                      </select>
                      <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                        {manPv(CATCHLOG_TIERS[CATCHLOG_TIERS.length - 1].pv)} 초과 시 10만 PV당{" "}
                        {won(CATCHLOG_EXTRA_PER_100K)} 추가. 첫 {CATCHLOG_TRIAL_DAYS}일 무료체험, 체험 종료 후
                        자동 결제 없음. {billing === "yearly" ? "연간 결제 시 월 요금 × 12로 계산됩니다." : ""}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      월 {won(FIXED_PRICES[c.key].monthly)} · 연 {won(FIXED_PRICES[c.key].yearly)}
                      <span className="ml-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        연간 2개월 무료
                      </span>
                    </p>
                  )}
                  <p className="mt-3 text-2xl font-extrabold text-secondary">
                    {won(price)}
                    <span className="ml-1 text-sm font-medium text-muted-foreground">/ {unit} · VAT 별도</span>
                  </p>
                </div>

                <ul className="mt-4 space-y-1.5 text-sm">
                  {c.features.map((f) => (
                    <li key={f} className="flex gap-2 text-foreground/85">
                      <span className="text-emerald-600">✓</span>
                      <span className="break-keep">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-dashed bg-card/60 p-4 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">번들 할인</p>
          <p className="mt-1">
            2종 구독 시 전체 금액 <strong className="text-secondary">{BUNDLE_DISCOUNT[2]}% 할인</strong> · 3종 구독 시 전체
            금액 <strong className="text-secondary">{BUNDLE_DISCOUNT[3]}% 할인</strong>. 모든 금액은 VAT 별도입니다.
          </p>
        </div>
      </div>

      {/* 견적 요약 + 문의 */}
      <aside className="rounded-2xl border bg-card p-5 shadow-sm lg:sticky lg:top-6">
        <p className="text-sm font-bold text-secondary">예상 구독료 ({billing === "yearly" ? "연간" : "월간"})</p>
        {q.items.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">솔루션을 1개 이상 선택하세요.</p>
        ) : (
          <dl className="mt-3 space-y-1.5 text-sm">
            {q.items.map((i) => {
              const c = CATALOG.find((x) => x.key === i.key)!;
              return (
                <div key={i.key} className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">
                    {c.brand}
                    {i.key === "log" ? <span className="ml-1 text-xs">({manPv(pv)})</span> : null}
                  </dt>
                  <dd className="font-medium">{won(i.price)}</dd>
                </div>
              );
            })}
            {q.discountRate > 0 ? (
              <div className="flex justify-between gap-3 text-emerald-700">
                <dt>번들 할인 {q.discountRate}% ({q.items.length}종)</dt>
                <dd className="font-medium">−{won(q.discount)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-3 border-t pt-2 text-base">
              <dt className="font-bold text-secondary">합계 (VAT 별도)</dt>
              <dd className="text-xl font-extrabold text-secondary">{won(q.total)}</dd>
            </div>
            <div className="flex justify-between gap-3 text-xs text-muted-foreground">
              <dt>VAT 포함</dt>
              <dd>{won(q.totalWithVat)}</dd>
            </div>
          </dl>
        )}

        <div className="mt-5 border-t pt-4">
          {sent ? (
            <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
              ✅ 구독 문의가 접수되었습니다. 담당자가 곧 연락드립니다.
            </div>
          ) : (
            <>
              <p className="text-sm font-semibold text-secondary">구독 문의</p>
              <p className="mt-0.5 text-xs text-muted-foreground">브랜드명과 연락처만 남겨주시면 세팅 안내를 드립니다.</p>
              <div className="mt-3 space-y-2">
                <Input placeholder="브랜드명 *" value={brand} onChange={(e) => setBrand(e.target.value)} maxLength={100} />
                <Input placeholder="연락처 * (010-0000-0000)" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" maxLength={20} />
              </div>
              {err ? <p className="mt-2 text-xs text-red-600">{err}</p> : null}
              <Button className="mt-3 w-full" disabled={!valid || busy} onClick={submit}>
                {busy ? "접수 중…" : "구독 문의하기"}
              </Button>
            </>
          )}
          <p className="mt-3 break-keep text-[11px] leading-relaxed text-muted-foreground">
            💡 광고비 페이백 고객에게는 솔루션 3종이 <strong>무료</strong>로 제공됩니다.
          </p>
        </div>
      </aside>
    </div>
  );
}
