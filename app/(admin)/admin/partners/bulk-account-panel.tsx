"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import {
  issueAccountsForContracted,
  resendCredentialsForContracted,
  type BulkIssueResult,
  type BulkResendResult,
} from "./bulk-account-actions";

export function BulkAccountPanel({
  pendingCount,
  accountCount,
}: {
  pendingCount: number;
  accountCount: number;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<BulkIssueResult | null>(null);
  const [resendPending, startResend] = useTransition();
  const [resendResult, setResendResult] = useState<BulkResendResult | null>(
    null,
  );

  if (pendingCount === 0 && accountCount === 0 && !result && !resendResult) {
    return null;
  }

  function run() {
    setResult(null);
    startTransition(async () => setResult(await issueAccountsForContracted()));
  }

  function runResend() {
    const ok = window.confirm(
      "입점 완료 대행사 전원의 임시 비밀번호를 새로 재발급하고 정정 안내 메일을 일괄 재발송합니다.\n기존 임시 비밀번호는 즉시 무효화됩니다. 진행할까요?",
    );
    if (!ok) return;
    setResendResult(null);
    startResend(async () =>
      setResendResult(await resendCredentialsForContracted()),
    );
  }

  return (
    <div className="space-y-3">
      {pendingCount > 0 || result ? (
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
      ) : null}

      {accountCount > 0 || resendResult ? (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-700">
            <strong>임시 비밀번호 재발급 + 정정 메일 발송</strong> — 계정이
            발급된 입점 완료 대행사 {accountCount}곳에게 임시 비밀번호를 새로
            발급하고 정정 안내 메일을 일괄 재발송합니다.
            {resendResult?.ok ? (
              <div className="mt-1 text-slate-600">
                발송 {resendResult.sent}건 · 실패 {resendResult.failed}건
                {resendResult.skipped ? ` · 스킵 ${resendResult.skipped}건` : ""}
              </div>
            ) : null}
            {resendResult && !resendResult.ok ? (
              <div className="mt-1 text-destructive">{resendResult.error}</div>
            ) : null}
          </div>
          <Button
            variant="outline"
            onClick={runResend}
            disabled={resendPending || accountCount === 0}
          >
            {resendPending ? "재발송 중..." : "재발급 + 정정 메일 발송"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
