"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import {
  issueAccountsForContracted,
  type BulkIssueResult,
} from "./bulk-account-actions";

export function BulkAccountPanel({ pendingCount }: { pendingCount: number }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<BulkIssueResult | null>(null);

  if (pendingCount === 0 && !result) return null;

  function run() {
    setResult(null);
    startTransition(async () => setResult(await issueAccountsForContracted()));
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-amber-900">
        <strong>로그인 계정 미발급 입점 대행사 {pendingCount}곳</strong>이
        있습니다. 일괄로 임시 계정을 발급하고 안내 메일을 보내세요.
        {result?.ok ? (
          <div className="mt-1 text-amber-800">
            발급 {result.issued}건 · 실패 {result.failed}건
            {result.skipped ? ` · 스킵 ${result.skipped}건` : ""}
          </div>
        ) : null}
        {result && !result.ok ? (
          <div className="mt-1 text-destructive">{result.error}</div>
        ) : null}
      </div>
      <Button onClick={run} disabled={pending || pendingCount === 0}>
        {pending ? "처리 중..." : "일괄 계정 발급"}
      </Button>
    </div>
  );
}
