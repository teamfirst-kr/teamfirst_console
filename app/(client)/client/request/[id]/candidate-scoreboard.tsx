"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RUBRIC, RUBRIC_MAX, totalScore } from "@/lib/schemas/candidate";

import type { CandidateView } from "./candidate-cards";

export function CandidateScoreboard({
  candidates,
}: {
  candidates: CandidateView[];
}) {
  const [proposalOf, setProposalOf] = useState<CandidateView | null>(null);
  const [referenceOf, setReferenceOf] = useState<CandidateView | null>(null);

  if (candidates.length === 0) return null;

  const withTotals = candidates
    .map((c) => ({ c, total: totalScore(c.scores) }))
    .sort((a, b) => b.total - a.total);
  const top = withTotals[0];

  // 컬럼별 최고값 (하이라이트용)
  const colMax: Record<string, number> = {};
  for (const r of RUBRIC) {
    colMax[r.key] = Math.max(...candidates.map((c) => Number(c.scores?.[r.key] ?? 0)));
  }

  const hasScores = withTotals.some((w) => w.total > 0);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardDescription>팀퍼스트 비교 분석</CardDescription>
        <CardTitle className="text-2xl">대행사 매칭 결과</CardTitle>
        <p className="text-sm text-muted-foreground">
          상대평가 방식을 통해 산출된 최적의 파트너 리스트입니다.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* TOP RANK */}
        {hasScores ? (
          <div className="rounded-xl border bg-muted/40 p-5 flex items-start justify-between gap-4">
            <div>
              <Badge variant="secondary">TOP RANK</Badge>
              <p className="mt-2 text-lg font-bold text-secondary">
                {top.c.partnerName}
              </p>
              {top.c.recommendationReason ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {top.c.recommendationReason}
                </p>
              ) : null}
            </div>
            <div className="text-right shrink-0">
              <span className="text-3xl font-extrabold text-secondary">
                {top.total}
              </span>
              <span className="text-sm text-muted-foreground"> / {RUBRIC_MAX}점</span>
            </div>
          </div>
        ) : null}

        {/* 비교표 */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-3 text-left font-medium">대행사명</th>
                <th className="px-3 py-3 font-medium">총점</th>
                {RUBRIC.map((r) => (
                  <th key={r.key} className="px-3 py-3 font-medium whitespace-nowrap">
                    {r.label}
                  </th>
                ))}
                <th className="px-3 py-3 font-medium">제안내용</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {withTotals.map(({ c, total }, i) => (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {c.partnerName}
                      </span>
                      {i === 0 && hasScores ? <Badge>TOP</Badge> : null}
                    </div>
                    {c.specialty ? (
                      <div className="text-xs text-muted-foreground">
                        {c.specialty}
                      </div>
                    ) : null}
                    <button
                      onClick={() => setReferenceOf(c)}
                      className="mt-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/85"
                    >
                      레퍼런스 보기
                    </button>
                  </td>
                  <td className="px-3 py-3 text-center font-bold text-secondary">
                    {total}
                  </td>
                  {RUBRIC.map((r) => {
                    const v = Number(c.scores?.[r.key] ?? 0);
                    const isMax = hasScores && v === colMax[r.key] && v > 0;
                    return (
                      <td
                        key={r.key}
                        className={
                          "px-3 py-3 text-center " +
                          (isMax ? "font-bold text-emerald-600" : "text-foreground")
                        }
                      >
                        {v}
                      </td>
                    );
                  })}
                  <td className="px-3 py-3 text-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setProposalOf(c)}
                    >
                      제안내용 확인
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>

      {/* 제안내용 모달 */}
      {proposalOf ? (
        <Modal title={`${proposalOf.partnerName} 제안 내용`} onClose={() => setProposalOf(null)}>
          <Field label="제안 개요" value={proposalOf.approach} />
          <Field label="팀 구성" value={proposalOf.teamComposition} />
          <Field label="진행 광고주" value={proposalOf.pastClients} />
          <Field label="강점/약점" value={proposalOf.strengthsWeaknesses} />
          <Field label="차별점" value={proposalOf.differentiation} />
          {proposalOf.quote ? (
            <p className="text-sm font-medium text-primary">
              월 견적 {proposalOf.quote.toLocaleString()}원
            </p>
          ) : null}
        </Modal>
      ) : null}

      {/* 레퍼런스 모달 */}
      {referenceOf ? (
        <Modal title={`${referenceOf.partnerName} 레퍼런스`} onClose={() => setReferenceOf(null)}>
          <Field label="전문 분야" value={referenceOf.specialty} />
          <Field label="추천 사유" value={referenceOf.recommendationReason} />
          <Field label="소개" value={referenceOf.approach} />
        </Modal>
      ) : null}
    </Card>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-xl bg-background p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-secondary">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            ✕
          </button>
        </div>
        <div className="space-y-3">{children}</div>
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>닫기</Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <p className="mt-0.5 whitespace-pre-wrap text-sm text-foreground">{value}</p>
    </div>
  );
}
