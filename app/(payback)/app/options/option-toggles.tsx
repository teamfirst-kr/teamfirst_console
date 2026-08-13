"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { requestOptionChange, type OptionResult } from "./actions";

export function OptionToggles({
  currentAll,
  currentConsulting,
  nextAll,
  nextConsulting,
  consultingEligible,
  lastSpendLabel,
  rateNow,
  rateIfAll,
  rateIfConsulting,
}: {
  currentAll: boolean;
  currentConsulting: boolean;
  nextAll: boolean;
  nextConsulting: boolean;
  consultingEligible: boolean;
  lastSpendLabel: string;
  rateNow: number;
  rateIfAll: number;
  rateIfConsulting: number;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<OptionResult | null>(null);

  function toggle(field: "all_solutions" | "consulting", next: boolean, msg: string) {
    if (!confirm(msg)) return;
    setResult(null);
    start(async () => setResult(await requestOptionChange(field, next)));
  }

  return (
    <div className="space-y-4">
      <OptionRow
        title="솔루션 전체 이용"
        desc="기본 제공 솔루션 외 전체 솔루션을 이용합니다. 추가 출시되는 솔루션도 자동 포함됩니다. 페이백률 −1%p."
        current={currentAll}
        next={nextAll}
        disabled={pending}
        onToggle={(v) =>
          toggle(
            "all_solutions",
            v,
            `익월 1일부터 적용됩니다. 적용 시 페이백률이 ${rateNow}% → ${rateIfAll}%로 변경됩니다. 진행할까요?`,
          )
        }
      />
      <OptionRow
        title="주간/월간 전문가 컨설팅"
        desc={`주간/월간 주기로 전문가 컨설팅을 받습니다. 페이백률 −2%p. (월 광고비 700만 원 이상 구간 전용 · 최근 확정 정산: ${lastSpendLabel})`}
        current={currentConsulting}
        next={nextConsulting}
        disabled={pending || (!nextConsulting && !consultingEligible)}
        disabledNote={
          !nextConsulting && !consultingEligible
            ? "월 광고비 700만 원 이상 구간에서 선택 가능합니다"
            : undefined
        }
        onToggle={(v) =>
          toggle(
            "consulting",
            v,
            `익월 1일부터 적용됩니다. 적용 시 페이백률이 ${rateNow}% → ${rateIfConsulting}%로 변경됩니다. 진행할까요?`,
          )
        }
      />
      {result ? (
        result.ok ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            변경 신청이 접수되었습니다. <strong>{result.effectiveFrom}</strong>부터
            적용됩니다. (당월 정산에는 반영되지 않습니다)
          </p>
        ) : (
          <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {result.error}
          </p>
        )
      ) : null}
    </div>
  );
}

function OptionRow({
  title,
  desc,
  current,
  next,
  disabled,
  disabledNote,
  onToggle,
}: {
  title: string;
  desc: string;
  current: boolean;
  next: boolean;
  disabled: boolean;
  disabledNote?: string;
  onToggle: (next: boolean) => void;
}) {
  const changePending = current !== next;
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border bg-card p-5">
      <div>
        <p className="font-semibold text-secondary">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
        {changePending ? (
          <p className="mt-1 text-xs font-medium text-amber-600">
            익월 1일부터 {next ? "적용" : "해제"} 예약됨
          </p>
        ) : null}
        {disabledNote ? (
          <p className="mt-1 text-xs text-muted-foreground">{disabledNote}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            current ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
          }`}
        >
          {current ? "이용 중" : "미이용"}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={disabled || changePending}
          onClick={() => onToggle(!next)}
        >
          {next ? "해제 신청" : "이용 신청"}
        </Button>
      </div>
    </div>
  );
}
