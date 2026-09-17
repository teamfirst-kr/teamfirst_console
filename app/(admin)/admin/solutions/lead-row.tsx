"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LeadStatus } from "@/types/database";

import { updateLeadStatus } from "./actions";
import { LEAD_STATUS_LABEL } from "./labels";

// 구독 문의 리드 한 줄의 처리 상태·메모 편집
export function LeadStatusEditor({ leadId, status, memo }: { leadId: string; status: LeadStatus; memo: string | null }) {
  const [st, setSt] = useState<LeadStatus>(status);
  const [note, setNote] = useState(memo ?? "");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const dirty = st !== status || note !== (memo ?? "");

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <select
        aria-label="처리 상태"
        value={st}
        onChange={(e) => setSt(e.target.value as LeadStatus)}
        className="h-8 rounded-md border bg-background px-2 text-xs"
      >
        {(Object.keys(LEAD_STATUS_LABEL) as LeadStatus[]).map((k) => (
          <option key={k} value={k}>
            {LEAD_STATUS_LABEL[k].label}
          </option>
        ))}
      </select>
      <Input
        aria-label="메모"
        placeholder="메모 (통화 내용 등)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="h-8 w-44 text-xs"
        maxLength={500}
      />
      <Button
        size="sm"
        variant="outline"
        className="h-8"
        disabled={pending || !dirty}
        onClick={() =>
          start(async () => {
            const r = await updateLeadStatus(leadId, st, note);
            setMsg(r.ok ? "저장됨" : r.error);
          })
        }
      >
        저장
      </Button>
      {msg ? <span className="text-[11px] text-muted-foreground">{msg}</span> : null}
    </div>
  );
}
