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
import { AD_PLATFORM_OPTIONS } from "@/lib/schemas/ad-spend";

import { Input } from "@/components/ui/input";

import { grantAnalysisAccess, setCandidateInterest } from "./candidate-actions";
import { proposeMeeting } from "./meeting-actions";

export type CandidateMeeting = {
  status: string;
  proposedSlots: string[];
  scheduledAt: string | null;
  meetUrl: string | null;
};

export type CandidateView = {
  id: string;
  rank: number;
  partnerName: string;
  specialty: string | null;
  status: string;
  recommendationReason: string | null;
  approach: string;
  teamComposition: string | null;
  pastClients: string | null;
  strengthsWeaknesses: string | null;
  differentiation: string | null;
  quote: number | null;
  startAvailable: string | null;
  grantedPlatforms: string[];
  meeting: CandidateMeeting | null;
  scores: Record<string, number> | null;
};

function fmtKst(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  });
}

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
        <Row label="진행 광고주" value={candidate.pastClients} />
        <Row label="강점/약점" value={candidate.strengthsWeaknesses} />
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

      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}

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
      </div>

      {status === "interested" || status === "meeting_set" ? (
        <>
          <AnalysisGrant
            candidateId={candidate.id}
            requestId={requestId}
            granted={candidate.grantedPlatforms}
          />
          <MeetingBlock
            candidateId={candidate.id}
            requestId={requestId}
            meeting={candidate.meeting}
          />
        </>
      ) : null}
    </div>
  );
}

function MeetingBlock({
  candidateId,
  requestId,
  meeting,
}: {
  candidateId: string;
  requestId: string;
  meeting: CandidateMeeting | null;
}) {
  const [pending, startTransition] = useTransition();
  const [slots, setSlots] = useState<string[]>(["", "", ""]);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      const r = await proposeMeeting(
        candidateId,
        requestId,
        slots.filter(Boolean),
      );
      if (!r.ok) setError(r.error);
    });
  }

  // 확정된 미팅
  if (meeting?.status === "confirmed" && meeting.scheduledAt) {
    return (
      <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm">
        <p className="font-medium text-emerald-700">미팅 확정</p>
        <p className="mt-1 text-foreground">{fmtKst(meeting.scheduledAt)}</p>
        {meeting.meetUrl ? (
          <a
            href={meeting.meetUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block text-primary hover:underline"
          >
            화상미팅 링크
          </a>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            화상미팅 링크는 미팅 2~3일 전 안내됩니다.
          </p>
        )}
      </div>
    );
  }

  // 제안했고 파트너 응답 대기 중
  if (meeting && meeting.proposedSlots.length > 0) {
    return (
      <div className="mt-4 rounded-md border bg-muted/30 p-3 text-sm">
        <p className="font-medium text-foreground">제안한 미팅 일정 (응답 대기)</p>
        <ul className="mt-1 list-disc list-inside text-muted-foreground">
          {meeting.proposedSlots.map((s) => (
            <li key={s}>{fmtKst(s)}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          {meeting.status === "rescheduling"
            ? "대행사가 대안 일정을 요청했습니다. 다시 제안해주세요."
            : "대행사의 응답을 기다리는 중입니다."}
        </p>
      </div>
    );
  }

  // 아직 미팅 제안 전
  return (
    <div className="mt-4 rounded-md border bg-muted/30 p-3">
      <p className="text-xs font-medium text-foreground">미팅 일정 제안</p>
      <p className="mt-1 text-xs text-muted-foreground">
        가능한 시간 후보를 최대 3개 제안하세요. 대행사가 응답하면 확정됩니다.
      </p>
      <div className="mt-2 space-y-2">
        {slots.map((s, i) => (
          <Input
            key={i}
            type="datetime-local"
            value={s}
            className="max-w-[260px]"
            onChange={(e) =>
              setSlots((prev) => {
                const next = [...prev];
                next[i] = e.target.value;
                return next;
              })
            }
          />
        ))}
      </div>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      <Button
        size="sm"
        className="mt-3"
        disabled={pending || slots.every((s) => !s)}
        onClick={submit}
      >
        {pending ? "전송 중..." : "일정 제안하기"}
      </Button>
    </div>
  );
}

function AnalysisGrant({
  candidateId,
  requestId,
  granted,
}: {
  candidateId: string;
  requestId: string;
  granted: string[];
}) {
  const [pending, startTransition] = useTransition();
  const [grantedSet, setGrantedSet] = useState<string[]>(granted);
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  function toggle(v: string) {
    setPicked((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const r = await grantAnalysisAccess(candidateId, requestId, picked);
      if (r.ok) {
        setGrantedSet((prev) => Array.from(new Set([...prev, ...picked])));
        setPicked([]);
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <div className="mt-4 rounded-md border bg-muted/30 p-3">
      <p className="text-xs font-medium text-foreground">분석권한 부여</p>
      <p className="mt-1 text-xs text-muted-foreground">
        이 대행사가 지난 3개월 광고비를 분석할 수 있도록 매체별 권한을
        부여합니다.
      </p>
      {grantedSet.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {grantedSet.map((g) => {
            const label =
              AD_PLATFORM_OPTIONS.find((p) => p.value === g)?.label ?? g;
            return (
              <Badge key={g} variant="success">
                {label} 부여됨
              </Badge>
            );
          })}
        </div>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-2">
        {AD_PLATFORM_OPTIONS.filter((p) => !grantedSet.includes(p.value)).map(
          (p) => (
            <label
              key={p.value}
              className="flex items-center gap-1.5 rounded-md border border-input px-2 py-1 text-xs cursor-pointer hover:bg-accent"
            >
              <input
                type="checkbox"
                className="h-3.5 w-3.5"
                checked={picked.includes(p.value)}
                onChange={() => toggle(p.value)}
              />
              {p.label}
            </label>
          ),
        )}
      </div>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      {picked.length > 0 ? (
        <Button
          size="sm"
          className="mt-3"
          disabled={pending}
          onClick={submit}
        >
          {pending ? "부여 중..." : `${picked.length}개 매체 권한 부여`}
        </Button>
      ) : null}
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
