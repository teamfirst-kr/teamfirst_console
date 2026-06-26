"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { issueMarketerAccount, type IssueAccountResult } from "../actions";

export function IssueAccountButton({
  id,
  hasAccount,
  email,
}: {
  id: string;
  hasAccount: boolean;
  email: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<IssueAccountResult | null>(null);

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">마케터 로그인 계정</p>
          <p className="text-sm text-muted-foreground">
            {hasAccount
              ? "계정이 발급되어 있습니다. 마케터가 콘솔에 로그인할 수 있습니다."
              : email
                ? `${email} 으로 계정을 발급합니다. (초기 임시 비번 + 첫 로그인 시 변경)`
                : "이메일을 먼저 입력·저장한 뒤 계정을 발급할 수 있습니다."}
          </p>
        </div>
        {hasAccount ? (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
            발급됨
          </span>
        ) : (
          <Button
            type="button"
            disabled={pending || !email}
            onClick={() =>
              startTransition(async () =>
                setResult(await issueMarketerAccount(id)),
              )
            }
          >
            {pending ? "발급 중..." : "계정 발급"}
          </Button>
        )}
      </div>
      {result ? (
        <p
          className={
            result.ok
              ? "mt-3 text-sm text-emerald-600"
              : "mt-3 text-sm text-destructive"
          }
        >
          {result.ok ? result.message : result.error}
        </p>
      ) : null}
    </div>
  );
}
