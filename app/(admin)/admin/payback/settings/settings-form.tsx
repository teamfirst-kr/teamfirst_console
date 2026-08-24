"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { savePbSettings, type SettingsResult } from "./settings-actions";

const MEDIA = [
  { value: "naver", label: "네이버" },
  { value: "kakao", label: "카카오" },
  { value: "google", label: "구글 (Phase 3)" },
  { value: "meta", label: "메타 (Phase 3)" },
];

export function PbSettingsForm({
  commissionRate,
  payoutDay,
  invoiceDueDay,
  minPayout,
  disputeDays,
  targetMedia,
  promo,
}: {
  commissionRate: number;
  payoutDay: number;
  invoiceDueDay: number;
  minPayout: number;
  disputeDays: number;
  targetMedia: string[];
  promo: { enabled?: boolean; bonus_rate?: number } | null;
}) {
  const [state, formAction, pending] = useActionState<SettingsResult | null, FormData>(
    savePbSettings,
    null,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-xl border bg-card p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="s-comm">매체 수취 수수료율 (%)</Label>
          <Input id="s-comm" name="commission_rate" type="number" step="0.1" defaultValue={commissionRate} />
          <p className="mt-1 text-xs text-muted-foreground">대사 화면 예상액 계산용 (D14)</p>
        </div>
        <div>
          <Label htmlFor="s-payout">지급일 (매월 N일, 휴일 시 익영업일)</Label>
          <Input id="s-payout" name="payout_day" type="number" min={1} max={28} defaultValue={payoutDay} />
        </div>
        <div>
          <Label htmlFor="s-due">계산서 발행 기한일 (익월 N일)</Label>
          <Input id="s-due" name="invoice_due_day" type="number" min={1} max={28} defaultValue={invoiceDueDay} />
        </div>
        <div>
          <Label htmlFor="s-min">최소 지급액 (원, 미만 시 이월)</Label>
          <Input id="s-min" name="min_payout" defaultValue={minPayout.toLocaleString()} />
        </div>
        <div>
          <Label htmlFor="s-dispute">이의신청 창 (영업일)</Label>
          <Input id="s-dispute" name="dispute_window_days" type="number" min={1} max={10} defaultValue={disputeDays} />
        </div>
      </div>
      <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4">
        <Label className="font-semibold">🎁 첫 달 프로모션</Label>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="promo_enabled"
              defaultChecked={promo?.enabled === true}
              className="h-4 w-4"
            />
            활성화 (첫 정산월: 보너스 %p 가산 + 솔루션·컨설팅 무료)
          </label>
          <span className="flex items-center gap-1.5">
            보너스
            <Input
              name="promo_bonus"
              type="number"
              step="0.5"
              min={0}
              max={5}
              defaultValue={promo?.bonus_rate ?? 1}
              className="h-8 w-16 text-right"
            />
            %p
          </span>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          끄면 랜딩·계산기·신청 폼의 프로모션 표기와 정산 자동 적용이 즉시
          중단됩니다. (이미 확정된 정산은 불변)
        </p>
      </div>
      <div>
        <Label>대상 매체</Label>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          {MEDIA.map((m) => (
            <label key={m.value} className="flex items-center gap-2">
              <input
                type="checkbox"
                name="target_media"
                value={m.value}
                defaultChecked={targetMedia.includes(m.value)}
                className="h-4 w-4"
              />
              {m.label}
            </label>
          ))}
        </div>
      </div>
      {state ? (
        state.ok ? (
          <p className="text-xs text-emerald-600">저장되었습니다.</p>
        ) : (
          <p className="text-xs text-destructive">{state.error}</p>
        )
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "저장 중..." : "설정 저장"}
      </Button>
    </form>
  );
}
