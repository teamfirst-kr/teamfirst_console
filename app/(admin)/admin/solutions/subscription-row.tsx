"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import type { SolutionSubscriptionStatus } from "@/types/database";

import { setSubscriptionStatus } from "./actions";

// 구독 고객 한 줄의 상태 전환 버튼 (세팅 중 → 활성화, 구독 중 ↔ 일시정지, 종료)
export function SubscriptionStatusActions({ id, status }: { id: string; status: SolutionSubscriptionStatus }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const go = (next: SolutionSubscriptionStatus) =>
    start(async () => {
      const r = await setSubscriptionStatus(id, next);
      setErr(r.ok ? null : r.error);
    });

  return (
    <div className="flex flex-wrap items-center gap-1">
      {status === "pending" || status === "paused" ? (
        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={pending} onClick={() => go("active")}>
          {status === "paused" ? "재개" : "활성화"}
        </Button>
      ) : null}
      {status === "active" ? (
        <Button size="sm" variant="outline" className="h-7 text-xs" disabled={pending} onClick={() => go("paused")}>
          일시정지
        </Button>
      ) : null}
      {status !== "ended" ? (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-destructive hover:bg-destructive/10"
          disabled={pending}
          onClick={() => {
            if (window.confirm("구독을 종료 처리할까요?")) go("ended");
          }}
        >
          종료
        </Button>
      ) : null}
      {err ? <span className="text-[11px] text-destructive">{err}</span> : null}
    </div>
  );
}
