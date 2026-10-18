"use client";

import { useState, useTransition } from "react";

import { setSubscriptionByToken } from "../actions";

export function ResubscribeButton({ token }: { token: string }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  if (done) return <p className="text-sm font-semibold text-secondary">다시 구독되었습니다.</p>;
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(async () => setDone((await setSubscriptionByToken(token, "subscribed")).ok))}
      className="inline-flex h-11 items-center border border-secondary px-6 text-sm font-semibold text-secondary transition-colors hover:bg-secondary hover:text-white disabled:opacity-50"
    >
      다시 구독하기
    </button>
  );
}
