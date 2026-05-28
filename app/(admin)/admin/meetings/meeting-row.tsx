"use client";

import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MEETING_STATUS_LABEL } from "@/lib/schemas/meeting";

import { setMeetUrl, setMeetingStatus } from "./actions";

export type MeetingRowData = {
  id: string;
  requestTitle: string;
  brandName: string;
  partnerName: string;
  status: string;
  scheduledAt: string | null;
  meetUrl: string | null;
  deadline: string | null;
  daysLeft: number | null;
};

function fmtKst(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  });
}

export function MeetingRow({ data }: { data: MeetingRowData }) {
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState(data.meetUrl ?? "");
  const [msg, setMsg] = useState<string | null>(null);

  const badge = MEETING_STATUS_LABEL[data.status] ?? {
    label: data.status,
    variant: "muted" as const,
  };

  return (
    <div className="rounded-lg border bg-card p-4 text-sm shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-foreground">{data.requestTitle}</div>
          <div className="text-xs text-muted-foreground">
            {data.brandName} × {data.partnerName}
          </div>
        </div>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>

      <div className="mt-2 text-muted-foreground">
        {data.scheduledAt ? (
          <span>일시: {fmtKst(data.scheduledAt)}</span>
        ) : (
          <span>일정 미확정</span>
        )}
        {data.daysLeft !== null && data.status === "confirmed" ? (
          <span className="ml-3">
            대행 결정 데드라인:{" "}
            <strong
              className={data.daysLeft <= 2 ? "text-destructive" : "text-foreground"}
            >
              D-{data.daysLeft}
            </strong>
          </span>
        ) : null}
      </div>

      {data.status === "confirmed" || data.status === "completed" ? (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="flex-1 min-w-[240px]">
            <Input
              placeholder="구글미트 링크 (https://meet.google.com/...)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => {
              setMsg(null);
              startTransition(async () => {
                const r = await setMeetUrl(data.id, url);
                setMsg(r.ok ? "링크 저장됨" : r.error);
              });
            }}
          >
            링크 저장
          </Button>
          {data.status === "confirmed" ? (
            <Button
              size="sm"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  await setMeetingStatus(data.id, "completed");
                });
              }}
            >
              미팅 완료 처리
            </Button>
          ) : null}
          {msg ? (
            <span className="text-xs text-muted-foreground">{msg}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
