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

import { acceptMeetingSlot, requestReschedule } from "./meeting-actions";

function fmtKst(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  });
}

export function MeetingResponse({
  meetingId,
  requestId,
  status,
  proposedSlots,
  scheduledAt,
  meetUrl,
}: {
  meetingId: string;
  requestId: string;
  status: string;
  proposedSlots: string[];
  scheduledAt: string | null;
  meetUrl: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [picked, setPicked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (status === "confirmed" && scheduledAt) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>미팅 확정</CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          <p className="font-medium text-foreground">{fmtKst(scheduledAt)}</p>
          {meetUrl ? (
            <a
              href={meetUrl}
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
        </CardContent>
      </Card>
    );
  }

  if (!proposedSlots || proposedSlots.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>미팅 일정 응답</CardTitle>
        <CardDescription>
          광고주가 제안한 일정 중 하나를 선택하거나 대안을 요청하세요.
          {status === "rescheduling" ? " (재조율 요청됨 — 새 제안 대기 중)" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          {proposedSlots.map((s) => (
            <label
              key={s}
              className={
                picked === s
                  ? "flex items-center gap-2 rounded-md border-2 border-primary bg-primary/5 px-3 py-2 text-sm cursor-pointer"
                  : "flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer hover:bg-accent"
              }
            >
              <input
                type="radio"
                name="slot"
                className="h-4 w-4"
                checked={picked === s}
                onChange={() => setPicked(s)}
              />
              {fmtKst(s)}
            </label>
          ))}
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-2">
          <Button
            disabled={pending || !picked}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const r = await acceptMeetingSlot(meetingId, requestId, picked!);
                if (!r.ok) setError(r.error);
              });
            }}
          >
            이 일정으로 확정
          </Button>
          <Button
            variant="outline"
            disabled={pending || status === "rescheduling"}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const r = await requestReschedule(meetingId, requestId);
                if (!r.ok) setError(r.error);
              });
            }}
          >
            대안 일정 요청
          </Button>
        </div>
        {status === "rescheduling" ? (
          <Badge variant="default">대안 요청됨</Badge>
        ) : null}
      </CardContent>
    </Card>
  );
}
