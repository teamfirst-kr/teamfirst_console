"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { submitDispute, type DisputeResult } from "../dispute-actions";

export function DisputeButton({
  settlementId,
  deadline,
}: {
  settlementId: string;
  deadline: string;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [result, setResult] = useState<DisputeResult | null>(null);

  if (result?.ok) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
        이의신청이 접수되었습니다. 담당자가 확인 후 연락드립니다.
      </p>
    );
  }

  return (
    <div className="print:hidden">
      {!open ? (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          이의신청 (~{deadline})
        </Button>
      ) : (
        <div className="space-y-2">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="어떤 항목이 다른지 구체적으로 적어주세요. (예: 8월 파워링크 소진액이 매체 리포트와 다릅니다)"
          />
          {result && !result.ok ? (
            <p className="text-xs text-destructive">{result.error}</p>
          ) : null}
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={pending || !note.trim()}
              onClick={() =>
                start(async () => setResult(await submitDispute(settlementId, note)))
              }
            >
              {pending ? "접수 중..." : "이의신청 제출"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
              닫기
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
