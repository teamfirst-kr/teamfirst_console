"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { currentPeriodKst, prevPeriod } from "@/lib/payback-domain";

import { addMediaReceipt, type ReceiptResult } from "./receipt-actions";

export function ReceiptForm() {
  const [state, formAction, pending] = useActionState<ReceiptResult | null, FormData>(
    addMediaReceipt,
    null,
  );

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-2 rounded-xl border bg-card p-4"
    >
      <div>
        <label htmlFor="r-media" className="text-xs text-muted-foreground">매체</label>
        <select
          id="r-media"
          name="media"
          className="mt-1 block h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="naver">네이버</option>
          <option value="kakao">카카오</option>
        </select>
      </div>
      <div>
        <label htmlFor="r-period" className="text-xs text-muted-foreground">기간 (YYYY-MM)</label>
        <Input
          id="r-period"
          name="period"
          defaultValue={prevPeriod(currentPeriodKst())}
          className="mt-1 h-9 w-28"
        />
      </div>
      <div>
        <label htmlFor="r-amount" className="text-xs text-muted-foreground">입금액 (원)</label>
        <Input id="r-amount" name="amount" inputMode="numeric" className="mt-1 h-9 w-36 text-right" />
      </div>
      <div>
        <label htmlFor="r-date" className="text-xs text-muted-foreground">입금일</label>
        <Input id="r-date" name="received_at" type="date" className="mt-1 h-9 w-36" />
      </div>
      <div className="flex-1">
        <label htmlFor="r-memo" className="text-xs text-muted-foreground">메모</label>
        <Input id="r-memo" name="memo" className="mt-1 h-9" />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "저장 중..." : "입금 기록"}
      </Button>
      {state && !state.ok ? (
        <p className="w-full text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
