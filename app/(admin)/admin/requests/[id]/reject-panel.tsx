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

import { rejectRequest, type RfpResult } from "./actions";

// 접수된 매칭 요청 반려 패널. 사유 입력 → 확인 단계를 거쳐 반려 확정.
export function RejectPanel({ requestId }: { requestId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<RfpResult | null>(null);

  function submit() {
    setResult(null);
    startTransition(async () => {
      const res = await rejectRequest(requestId, reason);
      setResult(res);
      if (res.ok) {
        setConfirming(false);
        setOpen(false);
      }
    });
  }

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-destructive">요청 반려</CardTitle>
        <CardDescription>
          기준 미달·정보 부족 등으로 진행이 어려운 요청은 사유와 함께
          반려하세요. 광고주에게 메일과 인앱 알림으로 통보됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!open ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
            onClick={() => {
              setOpen(true);
              setResult(null);
            }}
          >
            반려 사유 작성
          </Button>
        ) : (
          <>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setConfirming(false);
              }}
              rows={3}
              placeholder="예) 월 예산 정보가 없어 매칭 진행이 어렵습니다. 예산을 기재해 다시 제출해주세요."
              className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <div className="flex items-center gap-2">
              {!confirming ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={pending || reason.trim().length === 0}
                  onClick={() => setConfirming(true)}
                >
                  반려하기
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={pending}
                  onClick={submit}
                >
                  {pending ? "처리 중..." : "정말 반려할까요? (한 번 더 클릭)"}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => {
                  setOpen(false);
                  setConfirming(false);
                  setResult(null);
                }}
              >
                취소
              </Button>
            </div>
          </>
        )}

        {result && !result.ok ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {result.error}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
