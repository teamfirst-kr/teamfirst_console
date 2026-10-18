"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";

import { deleteIssue, sendIssueBatch, sendTestIssue } from "./actions";

// 호 상세의 발송 패널: 테스트 발송 → 구독자 발송(배치 반복) → 삭제
export function SendPanel({ issueId, published, sentCount, subscriberCount }: { issueId: string; published: boolean; sentCount: number; subscriberCount: number }) {
  const [pending, start] = useTransition();
  const [log, setLog] = useState<string[]>([]);
  const [progress, setProgress] = useState<{ sent: number; total: number } | null>(null);
  const push = (m: string) => setLog((l) => [m, ...l].slice(0, 20));

  function sendAll() {
    if (!window.confirm(`구독 중인 ${subscriberCount}명에게 발송할까요? (이미 받은 구독자는 자동으로 제외됩니다)`)) return;
    start(async () => {
      let acc = 0;
      for (let guard = 0; guard < 200; guard++) {
        const r = await sendIssueBatch(issueId);
        if (!r.ok) {
          push(`[오류] ${r.error}`);
          return;
        }
        acc += r.sent;
        setProgress({ sent: r.total - r.remaining, total: r.total });
        if (r.failed > 0) push(`[주의] 주소 오류로 ${r.failed}건 발송 실패 (이력에 failed로 기록, 재시도 대상에서 제외)`);
        if (r.remaining === 0) {
          push(acc === 0 ? "[완료] 보낼 구독자가 없습니다 (전원 발송 완료)." : `[완료] ${acc}명에게 발송을 완료했습니다.`);
          return;
        }
        push(`[진행] ${r.sent}명 발송, 남은 ${r.remaining}명`);
      }
    });
  }

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-base font-bold text-secondary">발송</p>
          <p className="text-xs text-muted-foreground">
            구독 중 {subscriberCount}명 · 이 호 발송 완료 {sentCount}명{published ? "" : " · 공개 상태가 아니라 구독자 발송 불가"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await sendTestIssue(issueId);
                push(r.ok ? `[테스트] ${r.to} 로 보냈습니다.` : `[오류] ${r.error}`);
              })
            }
          >
            내 메일로 테스트 발송
          </Button>
          <Button type="button" disabled={pending || !published || subscriberCount === 0} onClick={sendAll}>
            {pending ? "발송 중…" : sentCount > 0 ? "미발송 구독자에게 발송" : "구독자 전체 발송"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10"
            disabled={pending || sentCount > 0}
            onClick={() => {
              if (window.confirm("이 호를 삭제할까요?")) start(async () => {
                const r = await deleteIssue(issueId);
                if (r && !r.ok) push(`[오류] ${r.error}`);
              });
            }}
          >
            삭제
          </Button>
        </div>
      </div>
      {progress ? (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-all" style={{ width: `${progress.total ? Math.round((progress.sent / progress.total) * 100) : 100}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {progress.sent} / {progress.total}
          </p>
        </div>
      ) : null}
      {log.length > 0 ? (
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {log.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
