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
import { Textarea } from "@/components/ui/textarea";
import { MAX_CANDIDATES } from "@/lib/schemas/candidate";

import { selectCandidates, type SelectResult } from "./candidate-actions";

export type ApplicantCard = {
  applicationId: string;
  partnerName: string;
  quote: number | null;
  approach: string;
  teamComposition: string | null;
  differentiation: string | null;
  startAvailable: string | null;
  isCandidate: boolean;
  reason: string;
};

export function CandidateSelector({
  requestId,
  applicants,
  locked,
}: {
  requestId: string;
  applicants: ApplicantCard[];
  locked: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SelectResult | null>(null);
  // 선택 순서 = rank
  const [selected, setSelected] = useState<string[]>(
    applicants.filter((a) => a.isCandidate).map((a) => a.applicationId),
  );
  const [reasons, setReasons] = useState<Record<string, string>>(
    Object.fromEntries(applicants.map((a) => [a.applicationId, a.reason])),
  );

  function toggle(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_CANDIDATES) return prev;
      return [...prev, id];
    });
  }

  function submit() {
    setResult(null);
    startTransition(async () => {
      const payload = selected.map((id) => ({
        applicationId: id,
        reason: reasons[id] ?? "",
      }));
      setResult(await selectCandidates(requestId, payload));
    });
  }

  if (applicants.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>상위 3개사 선정</CardTitle>
          <CardDescription>아직 지원한 대행사가 없습니다.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>상위 3개사 선정 ({selected.length}/{MAX_CANDIDATES})</CardTitle>
        <CardDescription>
          광고주에게 제안할 대행사를 최대 {MAX_CANDIDATES}개 선택하고 추천 사유를
          입력하세요. 미선정 대행사에는 자동 통보 메일이 발송됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {applicants.map((a) => {
          const order = selected.indexOf(a.applicationId);
          const isSel = order >= 0;
          return (
            <div
              key={a.applicationId}
              className={
                isSel
                  ? "rounded-lg border-2 border-primary bg-primary/5 p-4 text-sm"
                  : "rounded-lg border p-4 text-sm"
              }
            >
              <div className="flex items-start justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    checked={isSel}
                    disabled={locked || (!isSel && selected.length >= MAX_CANDIDATES)}
                    onChange={() => toggle(a.applicationId)}
                  />
                  <span className="font-semibold text-foreground">
                    {a.partnerName}
                  </span>
                  {isSel ? <Badge>{order + 1}순위</Badge> : null}
                </label>
                <span className="text-primary font-medium">
                  {a.quote ? `${a.quote.toLocaleString()}원/월` : "견적 미기재"}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-foreground">
                {a.approach}
              </p>
              {a.differentiation ? (
                <p className="mt-1 text-muted-foreground">
                  <span className="text-xs">차별점</span> · {a.differentiation}
                </p>
              ) : null}
              {isSel ? (
                <div className="mt-3">
                  <Textarea
                    rows={2}
                    placeholder="광고주에게 보여줄 추천 사유"
                    value={reasons[a.applicationId] ?? ""}
                    disabled={locked}
                    onChange={(e) =>
                      setReasons((prev) => ({
                        ...prev,
                        [a.applicationId]: e.target.value,
                      }))
                    }
                  />
                </div>
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

        <Button
          className="w-full"
          disabled={pending || locked || selected.length === 0}
          onClick={submit}
        >
          {pending
            ? "처리 중..."
            : locked
              ? "후보 확정됨 (재선정하려면 다시 선택)"
              : `${selected.length}개사 후보 확정 및 광고주에게 전달`}
        </Button>
      </CardContent>
    </Card>
  );
}
