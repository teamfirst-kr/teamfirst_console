"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { formatKstDateTime, isoToKstLocal, issueStage, nextPublishSlot, STAGE_LABEL } from "@/lib/newsletter/highlight";
import type { NewsletterIssueRow } from "@/types/database";

import { approveAndSchedule, cancelSchedule, deleteIssue, requestReview, sendIssueBatch, sendTestIssue } from "./actions";

type IssueLite = Pick<NewsletterIssueRow, "id" | "status" | "sent_count" | "review_requested_at" | "approved_at" | "send_scheduled_at" | "send_started_at" | "send_completed_at">;

// 내일 09:00 KST (datetime-local 값)
function tomorrowNineKst(): string {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const d = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate() + 1, 9, 0, 0));
  return d.toISOString().slice(0, 16);
}

// 호 상세의 발행 패널: 검수 요청 → 승인·발송 예약(화면 안 확인) → 예약 시각 자동 발송. 비상용 수동 발송·삭제 포함.
// 브라우저 자동화(Cowork)가 누르는 버튼이므로 window.confirm 등 브라우저 확인 창은 쓰지 않는다.
// 지금(KST) 기준 datetime-local 최소값
function nowKstLocal(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 16);
}

export function SendPanel({
  issue,
  subscriberCount,
  approverHint,
  isApprover = true,
  cadence = "daily",
}: {
  issue: IssueLite;
  subscriberCount: number;
  approverHint?: string | null;
  isApprover?: boolean;
  cadence?: "5min" | "daily"; // 자동 발송 실행 주기 — 5min: pg_cron(037) 적용, daily: 매일 09:00 크론만
}) {
  const [pending, start] = useTransition();
  const [log, setLog] = useState<string[]>([]);
  const [progress, setProgress] = useState<{ sent: number; total: number } | null>(null);
  const [modal, setModal] = useState<"schedule" | "send" | "delete" | null>(null);
  const [slot, setSlot] = useState(() => isoToKstLocal(nextPublishSlot().toISOString()));
  const [checked, setChecked] = useState(false);
  const push = (m: string) => setLog((l) => [m, ...l].slice(0, 20));
  const stage = issueStage(issue);
  const published = issue.status === "published";

  // 예약 창 열기 — 이미 예약된 호는 현재 예약 시각, 아니면 다음 발행일 09:00 으로 채운다
  function openSchedule() {
    setSlot(issue.send_scheduled_at ? isoToKstLocal(issue.send_scheduled_at) : isoToKstLocal(nextPublishSlot().toISOString()));
    setChecked(false);
    setModal("schedule");
  }

  function sendAll() {
    setModal(null);
    start(async () => {
      let acc = 0;
      for (let guard = 0; guard < 200; guard++) {
        const r = await sendIssueBatch(issue.id);
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
        if (r.busy) {
          push("[대기] 자동 발송이 진행 중입니다. 잠시 후 상태를 확인하고, 남은 구독자가 있으면 다시 눌러주세요.");
          return;
        }
        push(`[진행] ${r.sent}명 발송, 남은 ${r.remaining}명`);
      }
    });
  }

  const stageText =
    stage === "scheduled" && issue.send_scheduled_at
      ? `발송 예약 · ${formatKstDateTime(issue.send_scheduled_at)} KST`
      : stage === "sent"
        ? `발송 완료 · ${issue.sent_count}명`
        : stage === "review" && issue.review_requested_at
          ? `검수 대기 · 요청 ${formatKstDateTime(issue.review_requested_at)} KST`
          : STAGE_LABEL[stage];

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-base font-bold text-secondary">발행 · 발송</p>
          <p className="text-xs text-muted-foreground">
            상태 <span className="font-semibold text-foreground">{stageText}</span> · 구독 중 {subscriberCount}명
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const r = await sendTestIssue(issue.id);
                push(r.ok ? `[테스트] ${r.to} 로 보냈습니다.` : `[오류] ${r.error}`);
              })
            }
          >
            내 메일로 테스트 발송
          </Button>
          {stage === "draft" || stage === "published" || stage === "review" ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await requestReview(issue.id);
                  push(r.ok ? `[검수 요청] ${r.to} 로 검수 메일을 보냈습니다.` : `[오류] ${r.error}`);
                })
              }
            >
              {stage === "review" ? "검수 메일 다시 보내기" : "검수 요청"}
            </Button>
          ) : null}
          {(stage === "draft" || stage === "published" || stage === "review") && isApprover ? (
            <Button type="button" disabled={pending} onClick={openSchedule}>
              승인·발송 예약
            </Button>
          ) : null}
          {stage === "scheduled" && isApprover ? (
            <>
              <Button type="button" disabled={pending} onClick={openSchedule}>
                예약 시각 변경
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    const r = await cancelSchedule(issue.id);
                    push(r.ok ? "[예약 취소] 승인과 예약을 해제했습니다. 다시 승인·예약할 수 있습니다." : `[오류] ${r.error}`);
                  })
                }
              >
                예약 취소
              </Button>
            </>
          ) : null}
          {isApprover ? (
            <Button type="button" variant="ghost" disabled={pending || !published || subscriberCount === 0} onClick={() => setModal("send")}>
              {issue.sent_count > 0 ? "미발송 구독자에게 수동 발송" : "수동 발송 (비상용)"}
            </Button>
          ) : null}
          <Button type="button" variant="ghost" className="text-destructive hover:bg-destructive/10" disabled={pending || issue.sent_count > 0} onClick={() => setModal("delete")}>
            삭제
          </Button>
        </div>
      </div>

      {modal === "schedule" ? (
        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <p className="text-sm font-bold text-secondary">{stage === "scheduled" ? "예약 시각 변경" : "승인·발송 예약"}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            예약 시각에 서버가 자동으로 공개하고 구독 중 {subscriberCount}명에게 발송합니다. 기본값은 다음 발행일(월·수·금) 오전 9시입니다. 예약 후에도 승인 권한자는 내용을 수정·저장할 수 있고, 예약 시각에는 수정된 내용으로 발송됩니다.
            {approverHint ? ` ${approverHint}` : ""}
          </p>
          {cadence === "5min" ? (
            <p className="mt-1 text-xs text-emerald-700">자동 발송은 5분 간격으로 실행됩니다. 예약 시각 이후 5분 이내에 발송됩니다.</p>
          ) : (
            <p className="mt-1 text-xs text-amber-700">
              자동 발송이 아직 매일 09:00 KST에만 실행됩니다(마이그레이션 037 미적용). 09:00 이후 시각으로 예약하면 다음 날 09:00에 발송됩니다.
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="text-xs">
              <span className="block font-semibold text-secondary">발송 시각 (KST)</span>
              <input id="send_slot" type="datetime-local" value={slot} min={nowKstLocal()} onChange={(e) => setSlot(e.target.value)} className="mt-1 h-9 rounded-md border bg-background px-2 text-sm" />
            </label>
            <div className="flex gap-1.5 text-xs">
              <Button type="button" size="sm" variant="outline" className="h-9" onClick={() => setSlot(tomorrowNineKst())}>
                내일 09:00
              </Button>
              <Button type="button" size="sm" variant="outline" className="h-9" onClick={() => setSlot(isoToKstLocal(nextPublishSlot().toISOString()))}>
                다음 발행일(월·수·금) 09:00
              </Button>
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input id="send_confirm" type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="h-4 w-4" />
              내용을 확인했고 이 시각에 발송합니다
            </label>
            <Button
              type="button"
              size="sm"
              disabled={pending || !checked || !slot}
              onClick={() =>
                start(async () => {
                  const wasScheduled = stage === "scheduled";
                  const r = await approveAndSchedule(issue.id, slot);
                  if (r.ok && r.scheduledAt) {
                    push(`${wasScheduled ? "[예약 변경]" : "[예약 완료]"} ${formatKstDateTime(r.scheduledAt)} KST 에 공개·발송됩니다.`);
                    setModal(null);
                    setChecked(false);
                  } else push(`[오류] ${r.error}`);
                })
              }
            >
              {stage === "scheduled" ? "변경한 시각으로 예약" : "승인하고 예약"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setModal(null)}>
              닫기
            </Button>
          </div>
        </div>
      ) : null}

      {modal === "send" ? (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <p className="text-sm font-bold text-secondary">지금 바로 구독 중 {subscriberCount}명에게 발송할까요?</p>
          <p className="mt-1 text-xs text-muted-foreground">이미 받은(또는 발송 진행 중인) 구독자는 자동으로 제외됩니다. 예약 자동 발송과 겹쳐도 중복으로 보내지 않습니다. 이 탭을 닫으면 멈추고, 다시 누르면 이어서 보냅니다.</p>
          <div className="mt-3 flex gap-2">
            <Button type="button" size="sm" onClick={sendAll} disabled={pending}>
              발송 시작
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setModal(null)}>
              취소
            </Button>
          </div>
        </div>
      ) : null}

      {modal === "delete" ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-800">이 호를 삭제할까요? 되돌릴 수 없습니다.</p>
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  const r = await deleteIssue(issue.id);
                  if (r && !r.ok) push(`[오류] ${r.error}`);
                })
              }
            >
              삭제
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setModal(null)}>
              취소
            </Button>
          </div>
        </div>
      ) : null}

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
