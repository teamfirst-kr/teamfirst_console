"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CANDIDATE_STATUS_LABEL } from "@/lib/schemas/candidate";

import { closeLost, decideWinner, type DecisionResult } from "./decision-actions";

export type DecisionCandidate = {
  id: string;
  partnerName: string;
  rank: number;
  status: string;
};

export function DecisionPanel({
  requestId,
  candidates,
  closed,
}: {
  requestId: string;
  candidates: DecisionCandidate[];
  closed: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<DecisionResult | null>(null);

  function run(fn: () => Promise<DecisionResult>) {
    setResult(null);
    startTransition(async () => setResult(await fn()));
  }

  if (candidates.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>대행 결정</CardTitle>
        <CardDescription>
          미팅 후 최종 대행사를 결정하세요. 성사 시 해당 대행사에 안내 메일이
          발송되고 요청이 마감됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {candidates
          .slice()
          .sort((a, b) => a.rank - b.rank)
          .map((c) => {
            const badge = CANDIDATE_STATUS_LABEL[c.status] ?? {
              label: c.status,
              variant: "muted" as const,
            };
            return (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg border p-3 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Badge>{c.rank}순위</Badge>
                  <span className="font-medium text-foreground">
                    {c.partnerName}
                  </span>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
                {!closed ? (
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() => run(() => decideWinner(requestId, c.id))}
                  >
                    이 대행사로 성사
                  </Button>
                ) : null}
              </div>
            );
          })}

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

        {!closed ? (
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => run(() => closeLost(requestId))}
          >
            대행 불발로 마감
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">마감된 요청입니다.</p>
        )}
      </CardContent>
    </Card>
  );
}
