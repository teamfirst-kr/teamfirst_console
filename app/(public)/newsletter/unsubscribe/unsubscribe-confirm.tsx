"use client";

import { useState, useTransition } from "react";

import { setSubscriptionByToken } from "../actions";

const btn = "inline-flex h-11 items-center px-6 text-sm font-semibold transition-colors disabled:opacity-50";

export function UnsubscribeConfirm({ token }: { token: string }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState<"ask" | "done" | "resubscribed" | "error">("ask");
  const [email, setEmail] = useState<string | undefined>();

  if (state === "error") {
    return (
      <>
        <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.01em] text-secondary">처리하지 못했습니다</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">링크가 만료되었거나 올바르지 않습니다. team1st2025@gmail.com 으로 알려주시면 바로 처리해 드립니다.</p>
      </>
    );
  }
  if (state === "resubscribed") {
    return (
      <>
        <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.01em] text-secondary">다시 구독되었습니다</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">다음 호부터 다시 보내드립니다.</p>
      </>
    );
  }
  if (state === "done") {
    return (
      <>
        <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.01em] text-secondary">수신거부가 완료되었습니다</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {email ? <span className="font-medium text-foreground">{email}</span> : "이 주소"} 로 더 이상 뉴스레터를 보내지 않습니다. 실수로 눌렀다면 아래 버튼으로 되돌릴 수 있습니다.
        </p>
        <button
          type="button"
          disabled={pending}
          onClick={() => start(async () => setState((await setSubscriptionByToken(token, "subscribed")).ok ? "resubscribed" : "error"))}
          className={btn + " mt-6 border border-secondary text-secondary hover:bg-secondary hover:text-white"}
        >
          다시 구독하기
        </button>
      </>
    );
  }
  return (
    <>
      <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.01em] text-secondary">뉴스레터 수신을 거부할까요?</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">아래 버튼을 누르면 더 이상 팀퍼스트 뉴스레터를 보내지 않습니다. 언제든 다시 구독할 수 있습니다.</p>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await setSubscriptionByToken(token, "unsubscribed");
            setEmail(r.email);
            setState(r.ok ? "done" : "error");
          })
        }
        className={btn + " mt-6 bg-secondary text-white hover:bg-secondary/90"}
      >
        {pending ? "처리 중" : "수신거부"}
      </button>
    </>
  );
}
