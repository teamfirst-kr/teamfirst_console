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

import { setCandidateInterest } from "./candidate-actions";

export type CandidateView = {
  id: string;
  rank: number;
  partnerName: string;
  specialty: string | null;
  status: string;
  recommendationReason: string | null;
  approach: string;
  teamComposition: string | null;
  similarCases: string | null;
  differentiation: string | null;
  quote: number | null;
  startAvailable: string | null;
};

export function CandidateCards({
  requestId,
  candidates,
}: {
  requestId: string;
  candidates: CandidateView[];
}) {
  if (candidates.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>추천 후보 대행사 ({candidates.length})</CardTitle>
        <CardDescription>
          운영팀이 선정한 상위 후보입니다. 관심 가는 대행사에 표시하시면 미팅
          일정 조율이 시작됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {candidates
          .slice()
          .sort((a, b) => a.rank - b.rank)
          .map((c) => (
            <CandidateItem key={c.id} requestId={requestId} candidate={c} />
          ))}
      </CardContent>
    </Card>
  );
}

function CandidateItem({
  requestId,
  candidate,
}: {
  requestId: string;
  candidate: CandidateView;
}) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(candidate.status);
  const [error, setError] = useState<string | null>(null);

  const badge = CANDIDATE_STATUS_LABEL[status] ?? {
    label: status,
    variant: "muted" as const,
  };

  function act(next: "interested" | "declined_by_client") {
    setError(null);
    startTransition(async () => {
      const r = await setCandidateInterest(candidate.id, requestId, next);
      if (r.ok) setStatus(next);
      else setError(r.error);
    });
  }

  const decided = status === "interested" || status === "declined_by_client";

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge>{candidate.rank}순위</Badge>
          <span className="font-semibold text-foreground">
            {candidate.partnerName}
          </span>
          {candidate.specialty ? (
            <span className="text-xs text-muted-foreground">
              {candidate.specialty}
            </span>
          ) : null}
        </div>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>

      {candidate.recommendationReason ? (
        <div className="mt-3 rounded-md bg-primary/5 p-3 text-sm">
          <span className="text-xs font-medium text-primary">추천 사유</span>
          <p className="mt-1 text-foreground">
            {candidate.recommendationReason}
          </p>
        </div>
      ) : null}

      <div className="mt-3 space-y-2 text-sm">
        <Row label="제안 개요" value={candidate.approach} />
        <Row label="팀 구성" value={candidate.teamComposition} />
        <Row label="유사 사례" value={candidate.similarCases} />
        <Row label="차별점" value={candidate.differentiation} />
        <div className="flex gap-6 pt-1">
          <span className="text-primary font-medium">
            {candidate.quote
              ? `${candidate.quote.toLocaleString()}원/월`
              : "견적 미기재"}
          </span>
          {candidate.startAvailable ? (
            <span className="text-muted-foreground">
              시작 가능: {candidate.startAvailable}
            </span>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      ) : null}

      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          disabled={pending || status === "interested"}
          onClick={() => act("interested")}
        >
          관심 있음
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={pending || status === "declined_by_client"}
          onClick={() => act("declined_by_client")}
        >
          관심 없음
        </Button>
        {decided ? (
          <span className="self-center text-xs text-muted-foreground">
            의사가 운영팀에 전달되었습니다.
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="whitespace-pre-wrap text-foreground">{value}</p>
    </div>
  );
}
