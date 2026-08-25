"use client";

import { useActionState, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  createRateTable,
  setRateTablePublished,
  type RateTableResult,
} from "./rate-actions";

export function PublishToggle({ id, published }: { id: string; published: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => {
        if (
          confirm(
            published
              ? "게시를 내리면 랜딩/계산기에 노출되지 않습니다. 계속할까요?"
              : "게시하면 랜딩/계산기와 신규 약정에 이 버전이 사용됩니다. 기존 약정은 변경되지 않습니다. 계속할까요?",
          )
        ) {
          start(async () => {
            await setRateTablePublished(id, !published);
          });
        }
      }}
    >
      {published ? "게시 내리기" : "게시하기"}
    </Button>
  );
}

export function RateTableForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<RateTableResult | null, FormData>(
    createRateTable,
    null,
  );

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        + 새 버전 작성
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-xl border bg-card p-5">
      <h2 className="font-bold text-secondary">새 요율표 버전</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="rt-version">버전명</Label>
          <Input id="rt-version" name="version" placeholder="v1.1" required />
        </div>
        <div>
          <Label htmlFor="rt-eff">적용일</Label>
          <Input id="rt-eff" name="effective_from" type="date" required />
        </div>
      </div>
      <div>
        <Label htmlFor="rt-tiers">구간 (min,max,rate — 슬래시로 구분, 마지막 max는 비움)</Label>
        <Input
          id="rt-tiers"
          name="tiers"
          defaultValue="0,3000000,8 / 3000000,5000000,9 / 5000000,7000000,10 / 7000000,20000000,11 / 20000000,,12"
          className="font-mono text-xs"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="rt-all">솔루션 전체 (−%p)</Label>
          <Input id="rt-all" name="mod_all" type="number" step="0.5" defaultValue="1" />
        </div>
        <div>
          <Label htmlFor="rt-cons">컨설팅 (−%p)</Label>
          <Input id="rt-cons" name="mod_consulting" type="number" step="0.5" defaultValue="1" />
        </div>
        <div>
          <Label htmlFor="rt-min">컨설팅 기준액 (원)</Label>
          <Input id="rt-min" name="min_spend" defaultValue="5,000,000" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" className="h-4 w-4" /> 작성 즉시 게시
      </label>
      {state && !state.ok ? (
        <p className="text-xs text-destructive">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="text-xs text-emerald-600">저장되었습니다.</p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "저장 중..." : "저장"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
          닫기
        </Button>
      </div>
    </form>
  );
}
