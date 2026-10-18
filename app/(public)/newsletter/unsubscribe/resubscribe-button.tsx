"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { setSubscriptionByToken } from "../actions";

export function ResubscribeButton({ token }: { token: string }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  if (done) return <p className="text-sm font-semibold text-emerald-700">✅ 다시 구독되었습니다.</p>;
  return (
    <Button variant="outline" disabled={pending} onClick={() => start(async () => setDone((await setSubscriptionByToken(token, "subscribed")).ok))}>
      다시 구독하기
    </Button>
  );
}
