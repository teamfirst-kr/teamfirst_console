"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RequestStatus } from "@/types/database";

import { sendRfp, setRequestStatus, type RfpResult } from "./actions";

export function RfpPanel({
  requestId,
  status,
  contractedCount,
  alreadySent,
}: {
  requestId: string;
  status: RequestStatus;
  contractedCount: number;
  alreadySent: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<RfpResult | null>(null);
  const [categoryFilter, setCategoryFilter] = useState(false);

  function run(fn: () => Promise<RfpResult>) {
    setResult(null);
    startTransition(async () => setResult(await fn()));
  }

  const canSend = contractedCount > 0;
  const sendLabel = alreadySent ? "RFP 재발송" : "RFP 발송";

  return (
    <Card>
      <CardHeader>
        <CardTitle>RFP 발송</CardTitle>
        <CardDescription>
          입점 완료 대행사 전원에게 RFP를 발송합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm">
          발송 대상:{" "}
          <strong className="text-primary">
            {categoryFilter ? "요청 매체 일치 대행사" : `${contractedCount}개사`}
          </strong>
        </p>
        <label className="flex items-start gap-2 rounded-md border border-input p-2.5 text-xs cursor-pointer hover:bg-accent">
          <input
            type="checkbox"
            checked={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.checked)}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            요청 매체와 일치하는 카테고리의 대행사에게만 발송 (입점사가 많아질 때
            스팸화 방지)
          </span>
        </label>
        <Button
          className="w-full"
          disabled={!canSend || pending}
          onClick={() => run(() => sendRfp(requestId, categoryFilter))}
        >
          {pending ? "처리 중..." : sendLabel}
        </Button>

        {status === "rfp_sent" ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={pending}
            onClick={() => run(() => setRequestStatus(requestId, "collecting"))}
          >
            지원 수집 단계로 전환
          </Button>
        ) : null}

        {result ? (
          <div
            className={
              result.ok
                ? "rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
                : "rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
            }
          >
            {result.ok ? result.message : result.error}
          </div>
        ) : null}

        <p className="text-xs text-muted-foreground">
          발송 시 입점 완료 대행사 전원에게 안내 메일이 발송됩니다.
        </p>
      </CardContent>
    </Card>
  );
}
