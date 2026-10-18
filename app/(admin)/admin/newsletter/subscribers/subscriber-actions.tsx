"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { deleteSubscriber, setSubscriberStatus } from "../actions";

export function SubscriberActions({ id, status }: { id: string; status: "subscribed" | "unsubscribed" }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [armed, setArmed] = useState(false); // 삭제는 2단계 버튼 (브라우저 확인 창 미사용)
  return (
    <div className="flex items-center gap-1">
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs"
        disabled={pending}
        onClick={() => start(async () => setErr((await setSubscriberStatus(id, status === "subscribed" ? "unsubscribed" : "subscribed")).error ?? null))}
      >
        {status === "subscribed" ? "수신거부 처리" : "재구독"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs text-destructive hover:bg-destructive/10"
        disabled={pending}
        onBlur={() => setArmed(false)}
        onClick={() => {
          if (!armed) {
            setArmed(true);
            return;
          }
          setArmed(false);
          start(async () => setErr((await deleteSubscriber(id)).error ?? null));
        }}
      >
        {armed ? "정말 삭제 (한 번 더 클릭)" : "삭제"}
      </Button>
      {err ? <span className="text-[11px] text-destructive">{err}</span> : null}
    </div>
  );
}
