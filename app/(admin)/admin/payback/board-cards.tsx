"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  pbActivateClient,
  pbConvertAndSendAgreement,
  pbMarkSigned,
  pbRejectApplication,
  pbSetMediaTransfer,
  pbStartReview,
  type PbActionResult,
} from "./actions";

function ResultNote({ result }: { result: PbActionResult | null }) {
  if (!result) return null;
  if (!result.ok) {
    return (
      <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-1.5 text-xs text-destructive">
        {result.error}
      </p>
    );
  }
  return (
    <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700">
      {result.message ?? "처리 완료"}
      {result.tempPassword ? (
        <p className="mt-1">
          계정 발급됨 — <strong>{result.email}</strong> / 임시 비밀번호{" "}
          <strong className="font-mono">{result.tempPassword}</strong>
          <span className="block text-emerald-600">
            ⚠️ 지금만 표시됩니다. 안내 메일과 별도로 전달하세요.
          </span>
        </p>
      ) : null}
    </div>
  );
}

// 신청 카드 액션 (received / reviewing)
export function ApplicationActions({
  applicationId,
  status,
  initialBizno = "",
}: {
  applicationId: string;
  status: string;
  initialBizno?: string;
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<PbActionResult | null>(null);
  const [glosign, setGlosign] = useState("");
  const [bizno, setBizno] = useState(initialBizno);
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState("");
  const biznoOk = bizno.replace(/\D/g, "").length === 10;

  return (
    <div className="mt-3 border-t pt-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {status === "received" ? (
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => start(async () => setResult(await pbStartReview(applicationId)))}
          >
            검토 시작
          </Button>
        ) : null}
        <Input
          placeholder="사업자번호 10자리 (등록증 참조)"
          value={bizno}
          onChange={(e) => setBizno(e.target.value)}
          className="h-9 w-44 text-xs"
        />
        <Input
          placeholder="글로싸인 URL"
          value={glosign}
          onChange={(e) => setGlosign(e.target.value)}
          className="h-9 w-52 text-xs"
        />
        <Button
          size="sm"
          disabled={pending || !glosign.trim() || !biznoOk}
          onClick={() =>
            start(async () =>
              setResult(await pbConvertAndSendAgreement(applicationId, glosign, bizno)),
            )
          }
        >
          약정 발송 처리
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:bg-destructive/10"
          disabled={pending}
          onClick={() => setRejectMode((v) => !v)}
        >
          반려
        </Button>
      </div>
      {rejectMode ? (
        <div className="mt-2 flex items-center gap-1.5">
          <Input
            placeholder="반려 사유 (필수)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="h-9 flex-1 text-xs"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={pending || !reason.trim()}
            onClick={() =>
              start(async () => setResult(await pbRejectApplication(applicationId, reason)))
            }
          >
            반려 확정
          </Button>
        </div>
      ) : null}
      <ResultNote result={result} />
    </div>
  );
}

const TRANSFER_LABEL: Record<string, string> = {
  pending: "대기",
  in_progress: "진행 중",
  completed: "완료",
  released: "해제됨",
};

// 고객사 카드 액션 (agreement_sent / transferring)
export function ClientActions({
  clientId,
  status,
  medias,
}: {
  clientId: string;
  status: string;
  medias: { id: string; media: string; account_id: string; transfer_status: string }[];
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<PbActionResult | null>(null);

  return (
    <div className="mt-3 border-t pt-3">
      {status === "agreement_sent" ? (
        <Button
          size="sm"
          disabled={pending}
          onClick={() => start(async () => setResult(await pbMarkSigned(clientId)))}
        >
          서명 확인 → 이관 단계로
        </Button>
      ) : null}

      {status === "transferring" ? (
        <div className="space-y-2">
          {medias.map((m) => (
            <div key={m.id} className="flex items-center gap-2 text-xs">
              <span className="w-14 font-medium uppercase text-muted-foreground">
                {m.media}
              </span>
              <span className="flex-1 truncate text-muted-foreground">
                {m.account_id}
              </span>
              <select
                value={m.transfer_status}
                disabled={pending}
                onChange={(e) =>
                  start(async () =>
                    setResult(
                      await pbSetMediaTransfer(
                        m.id,
                        e.target.value as "pending" | "in_progress" | "completed",
                      ),
                    ),
                  )
                }
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                {["pending", "in_progress", "completed"].map((s) => (
                  <option key={s} value={s}>
                    {TRANSFER_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <Button
            size="sm"
            disabled={pending}
            onClick={() => start(async () => setResult(await pbActivateClient(clientId)))}
          >
            🚀 활성화 (계정 발급 + 솔루션 오픈)
          </Button>
        </div>
      ) : null}
      <ResultNote result={result} />
    </div>
  );
}
