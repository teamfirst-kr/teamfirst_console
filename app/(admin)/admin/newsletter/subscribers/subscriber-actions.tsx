"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { deleteSubscriber, setSubscriberStatus } from "../actions";

export function SubscriberActions({ id, status }: { id: string; status: "subscribed" | "unsubscribed" }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
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
        onClick={() => {
          if (window.confirm("구독자를 완전히 삭제할까요? (개인정보 삭제 요청 시)")) start(async () => setErr((await deleteSubscriber(id)).error ?? null));
        }}
      >
        삭제
      </Button>
      {err ? <span className="text-[11px] text-destructive">{err}</span> : null}
    </div>
  );
}
