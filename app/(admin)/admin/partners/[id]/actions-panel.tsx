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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PartnerStatus } from "@/types/database";

import {
  attachContract,
  markContractedAndIssueAccount,
  markReviewing,
  rejectPartner,
  type ActionResult,
} from "./actions";

export function PartnerActionsPanel({
  partnerId,
  status,
  contactEmail,
  hasUser,
  hasOpenContract,
}: {
  partnerId: string;
  status: PartnerStatus;
  contactEmail: string;
  hasUser: boolean;
  hasOpenContract: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [glosignUrl, setGlosignUrl] = useState("");
  const [contractNotes, setContractNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [result, setResult] = useState<ActionResult | null>(null);

  function run(fn: () => Promise<ActionResult>) {
    setResult(null);
    startTransition(async () => {
      const r = await fn();
      setResult(r);
    });
  }

  const canReview = status === "pending";
  const canAttachContract = status === "pending" || status === "reviewing";
  // 계정 미발급 파트너에게 입점완료+계정발급. 임포트로 들어온 contracted(계정X)도 포함.
  const canMarkContracted =
    !hasUser &&
    (status === "pending" || status === "reviewing" || status === "contracted");
  const canReject = status === "pending" || status === "reviewing";

  return (
    <aside className="space-y-4 lg:sticky lg:top-6 self-start">
      <Card>
        <CardHeader>
          <CardTitle>처리 액션</CardTitle>
          <CardDescription>
            현재 상태: <strong>{status}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 검토 시작 */}
          <Button
            className="w-full"
            disabled={!canReview || pending}
            onClick={() => run(() => markReviewing(partnerId))}
          >
            검토 시작
          </Button>

          {/* 글로싸인 링크 첨부 */}
          <div className="space-y-2 rounded-lg border p-3">
            <div className="text-sm font-medium">글로싸인 계약서 등록</div>
            <Label htmlFor="glosign_url" className="text-xs">
              계약서 URL
            </Label>
            <Input
              id="glosign_url"
              placeholder="https://glosign.com/..."
              value={glosignUrl}
              onChange={(e) => setGlosignUrl(e.target.value)}
            />
            <Label htmlFor="contract_notes" className="text-xs">
              메모 (선택)
            </Label>
            <Textarea
              id="contract_notes"
              rows={2}
              value={contractNotes}
              onChange={(e) => setContractNotes(e.target.value)}
            />
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              disabled={!canAttachContract || !glosignUrl || pending}
              onClick={() =>
                run(() =>
                  attachContract(partnerId, glosignUrl, contractNotes),
                )
              }
            >
              계약서 등록
            </Button>
          </div>

          {/* 계약 완료 + 계정 발급 */}
          <div className="space-y-2 rounded-lg border bg-primary/5 p-3">
            <div className="text-sm font-medium">
              {status === "contracted" ? "파트너 계정 발급" : "계약 완료 + 계정 발급"}
            </div>
            <p className="text-xs text-muted-foreground">
              {hasUser
                ? "이미 계정이 발급된 파트너입니다."
                : `${contactEmail} 으로 파트너 계정을 발급합니다. 발급된 임시 비밀번호는 이 화면에서 한 번만 확인 가능합니다.`}
            </p>
            <Button
              size="sm"
              className="w-full"
              disabled={!canMarkContracted || pending}
              onClick={() =>
                run(() => markContractedAndIssueAccount(partnerId))
              }
            >
              {status === "contracted" ? "계정 발급" : "입점 완료 처리"}
            </Button>
          </div>

          {/* 거절 */}
          <div className="space-y-2 rounded-lg border p-3">
            <div className="text-sm font-medium text-destructive">거절</div>
            <Label htmlFor="reject_reason" className="text-xs">
              사유 (운영자 메모에 저장)
            </Label>
            <Textarea
              id="reject_reason"
              rows={2}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <Button
              size="sm"
              variant="destructive"
              className="w-full"
              disabled={!canReject || pending}
              onClick={() => run(() => rejectPartner(partnerId, rejectReason))}
            >
              신청 거절
            </Button>
          </div>

          {result ? (
            <div
              className={
                result.ok
                  ? "rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
                  : "rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
              }
            >
              <p>{result.ok ? result.message : result.error}</p>
              {result.ok && result.tempPassword ? (
                <div className="mt-2 rounded border bg-white p-2 font-mono text-xs">
                  임시 비밀번호: {result.tempPassword}
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </aside>
  );
}
