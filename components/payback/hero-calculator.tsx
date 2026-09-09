"use client";

import { useEffect, useMemo, useState } from "react";

import { ApplyCtaLink } from "@/components/analytics/apply-cta";
import { saveCalcState } from "@/lib/calc-state";
import { calcPayback, type PaybackPromo, type RateTable } from "@/lib/payback";

const MIN = 500_000; // 슬라이더 50만
const MAX = 50_000_000; // 슬라이더 5,000만
const STEP = 100_000;

function fmt(won: number): string {
  return won.toLocaleString("ko-KR");
}

// 히어로 우측 컴팩트 계산기 — 월 광고비 하나만 입력하면 예상 페이백이 바로 보인다.
// 옵션(솔루션·컨설팅) 요율 조정은 신청 단계에서 선택 — 여기서는 기본 요율 기준.
// 정산 엔진과 동일한 lib/payback.ts를 사용한다 (스펙 §3).
export function HeroCalculator({
  table,
  promo = null,
}: {
  table: RateTable;
  promo?: PaybackPromo | null;
}) {
  const [adSpend, setAdSpend] = useState(5_000_000);

  // 입력값을 세션에 공유 — 간편 신청 팝업(예산)·상세 신청 폼 프리필용
  useEffect(() => {
    saveCalcState({ b: adSpend, a: 0, c: 0 });
  }, [adSpend]);

  const result = useMemo(
    () =>
      calcPayback(table, {
        adSpend,
        allSolutions: false,
        consulting: false,
        invoiceCapable: true,
      }),
    [table, adSpend],
  );

  const promoResult = useMemo(
    () =>
      promo
        ? calcPayback(
            table,
            {
              adSpend,
              allSolutions: false,
              consulting: false,
              invoiceCapable: true,
            },
            promo,
          )
        : null,
    [table, adSpend, promo],
  );

  function onInput(raw: string) {
    const n = Number(raw.replace(/[^\d]/g, ""));
    setAdSpend(Number.isFinite(n) ? Math.max(0, Math.min(n, 999_999_999_999)) : 0);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-card p-5 text-left text-foreground shadow-2xl shadow-black/30 sm:p-6">
      <p className="text-sm font-bold text-secondary">내 페이백 계산해보기</p>

      {promo ? (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
          🎁 첫 달 +{promo.bonusRate}%p 추가 페이백
          {promo.freeOptions ? " · 솔루션·컨설팅 무료" : ""}
        </p>
      ) : null}

      <label
        htmlFor="hero-pb-spend"
        className="mt-4 block text-xs font-semibold text-muted-foreground"
      >
        월 광고비 (VAT 제외)
      </label>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          id="hero-pb-spend"
          inputMode="numeric"
          value={fmt(adSpend)}
          onChange={(e) => onInput(e.target.value)}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-right text-base font-bold text-secondary"
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
        className="mt-2.5 w-full accent-[#004AAD]"
        aria-label="월 광고비 슬라이더"
      />
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>50만</span>
        <span>5,000만</span>
      </div>

      <div className="mt-4 rounded-xl bg-secondary p-4 text-white">
        {promoResult ? (
          <>
            <p className="text-[11px] font-medium uppercase tracking-wider text-amber-300">
              첫 달 예상 페이백
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[26px] font-extrabold leading-none tracking-tight text-amber-300">
                {fmt(promoResult.supplyValue)}
              </span>
              <span className="text-sm text-white/80">원</span>
              <span className="ml-1 rounded bg-amber-400/20 px-1.5 py-0.5 text-xs font-bold text-amber-300">
                {promoResult.appliedRate}%
              </span>
            </div>
            <p className="mt-1.5 text-xs text-white/80">
              2개월 차부터{" "}
              <strong className="text-white">{fmt(result.supplyValue)}원</strong>
              /월 ({result.appliedRate}%) · 연 환산{" "}
              {fmt(result.supplyValue * 12)}원
            </p>
          </>
        ) : (
          <>
            <p className="text-[11px] font-medium uppercase tracking-wider text-white/70">
              예상 페이백
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[26px] font-extrabold leading-none tracking-tight">
                {fmt(result.supplyValue)}
              </span>
              <span className="text-sm text-white/80">원 / 월</span>
              <span className="ml-1 rounded bg-sky-400/20 px-1.5 py-0.5 text-xs font-bold text-sky-300">
                {result.appliedRate}%
              </span>
            </div>
            <p className="mt-1.5 text-xs text-white/70">
              연 환산 {fmt(result.supplyValue * 12)}원 · 부가세 별도 지급
            </p>
          </>
        )}
      </div>

      <ApplyCtaLink location="hero_calc" className="mt-4 w-full">
        이 조건으로 신청하기
      </ApplyCtaLink>

      <p className="mt-3 break-keep text-center text-[11px] leading-relaxed text-muted-foreground">
        요율표 {table.version} 기준 · 솔루션·컨설팅 옵션 선택 시 요율이 일부
        조정됩니다
      </p>
    </div>
  );
}
