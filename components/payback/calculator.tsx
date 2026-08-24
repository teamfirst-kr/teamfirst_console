"use client";

import { useMemo, useState } from "react";

import {
  calcPayback,
  consultingEligible,
  type PaybackPromo,
  type RateTable,
} from "@/lib/payback";

const MIN = 500_000; // 슬라이더 50만
const MAX = 50_000_000; // 슬라이더 5,000만
const STEP = 100_000;

function fmt(won: number): string {
  return won.toLocaleString("ko-KR");
}

// 공개 랜딩 페이백 계산기 — 정산 엔진과 동일한 lib/payback.ts 사용 (스펙 §3)
export function PaybackCalculator({
  table,
  promo = null,
}: {
  table: RateTable;
  promo?: PaybackPromo | null;
}) {
  const [adSpend, setAdSpend] = useState(5_000_000);
  const [allSolutions, setAllSolutions] = useState(false);
  const [consulting, setConsulting] = useState(false);

  const eligible = consultingEligible(table, adSpend);
  const effectiveConsulting = consulting && eligible;

  const result = useMemo(
    () =>
      calcPayback(table, {
        adSpend,
        allSolutions,
        consulting: effectiveConsulting,
        invoiceCapable: true,
      }),
    [table, adSpend, allSolutions, effectiveConsulting],
  );

  // 첫 달 프로모션 적용치 (활성 시)
  const promoResult = useMemo(
    () =>
      promo
        ? calcPayback(
            table,
            {
              adSpend,
              allSolutions,
              consulting: effectiveConsulting,
              invoiceCapable: true,
            },
            promo,
          )
        : null,
    [table, adSpend, allSolutions, effectiveConsulting, promo],
  );

  function onInput(raw: string) {
    const n = Number(raw.replace(/[^\d]/g, ""));
    setAdSpend(Number.isFinite(n) ? Math.max(0, Math.min(n, 999_999_999_999)) : 0);
  }

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-6 shadow-lg md:p-8">
      <div className="grid gap-8 md:grid-cols-2">
        {/* 입력 */}
        <div>
          <label
            htmlFor="pb-spend"
            className="text-sm font-semibold text-secondary"
          >
            월 광고비 <span className="font-normal text-muted-foreground">(VAT 제외)</span>
          </label>
          <div className="mt-2 flex items-center gap-2">
            <input
              id="pb-spend"
              inputMode="numeric"
              value={fmt(adSpend)}
              onChange={(e) => onInput(e.target.value)}
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-right text-lg font-bold text-secondary"
            />
            <span className="shrink-0 text-sm text-muted-foreground">원</span>
          </div>
          <input
            type="range"
            min={MIN}
            max={MAX}
            step={STEP}
            value={Math.max(MIN, Math.min(adSpend, MAX))}
            onChange={(e) => setAdSpend(Number(e.target.value))}
            className="mt-3 w-full accent-[#004AAD]"
            aria-label="월 광고비 슬라이더"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>50만</span>
            <span>5,000만</span>
          </div>

          <div className="mt-5 space-y-2.5">
            <label className="flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                type="checkbox"
                checked={allSolutions}
                onChange={(e) => setAllSolutions(e.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              <span>
                솔루션 전체 이용{" "}
                <span className="text-muted-foreground">
                  (−{table.modifiers.allSolutions}%p)
                </span>
              </span>
            </label>
            <label
              className={
                "flex items-start gap-2.5 text-sm " +
                (eligible ? "cursor-pointer" : "cursor-not-allowed opacity-50")
              }
              title={
                eligible
                  ? undefined
                  : "주간/월간 전문가 컨설팅 옵션은 월 광고비 700만 원 이상 구간에서 선택 가능합니다"
              }
            >
              <input
                type="checkbox"
                checked={effectiveConsulting}
                disabled={!eligible}
                onChange={(e) => setConsulting(e.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              <span>
                주간/월간 전문가 컨설팅{" "}
                <span className="text-muted-foreground">
                  (−{table.modifiers.consulting}%p)
                </span>
                {!eligible ? (
                  <span className="block text-xs text-muted-foreground">
                    월 광고비 700만 원 이상 구간에서 선택 가능
                  </span>
                ) : null}
              </span>
            </label>
          </div>
        </div>

        {/* 출력 */}
        <div className="rounded-xl bg-secondary p-6 text-white">
          {promoResult ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-amber-300">
                🎁 첫 달 예상 페이백 (+{promoResult.promoBonus}%p · 옵션 무료)
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-amber-300">
                  {fmt(promoResult.supplyValue)}
                </span>
                <span className="text-sm text-white/80">원</span>
                <span className="ml-1 rounded bg-amber-400/20 px-1.5 py-0.5 text-xs font-bold text-amber-300">
                  {promoResult.appliedRate}%
                </span>
              </div>
              <p className="mt-2 text-sm text-white/85">
                2개월 차부터{" "}
                <strong className="text-white">{fmt(result.supplyValue)}원</strong> / 월
                ({result.appliedRate}%)
              </p>
              <p className="mt-1 text-xs text-white/70">부가세 별도 지급</p>
            </>
          ) : (
            <>
              <p className="text-xs font-medium uppercase tracking-wider text-white/70">
                예상 페이백
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight">
                  {fmt(result.supplyValue)}
                </span>
                <span className="text-sm text-white/80">원 / 월</span>
              </div>
              <p className="mt-1 text-xs text-white/70">부가세 별도 지급</p>
            </>
          )}

          <dl className="mt-5 space-y-2 border-t border-white/15 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-white/70">광고비 구간</dt>
              <dd className="font-medium">{result.tierLabel}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/70">기본 요율</dt>
              <dd className="font-medium">{result.baseRate}%</dd>
            </div>
            {result.modifierTotal > 0 ? (
              <div className="flex justify-between">
                <dt className="text-white/70">옵션 조정</dt>
                <dd className="font-medium">−{result.modifierTotal}%p</dd>
              </div>
            ) : null}
            <div className="flex justify-between text-base">
              <dt className="font-semibold text-white/90">적용 요율</dt>
              <dd className="font-extrabold text-sky-300">
                {result.appliedRate}%
              </dd>
            </div>
            <div className="flex justify-between border-t border-white/15 pt-2">
              <dt className="text-white/70">연 환산</dt>
              <dd className="font-bold">{fmt(result.supplyValue * 12)}원</dd>
            </div>
          </dl>
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground">
        요율표 {table.version} 기준 · 실제 페이백은 당월 실집행 광고비(매체 리포트
        기준)로 매월 자동 산정됩니다
      </p>
    </div>
  );
}
