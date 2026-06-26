"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MARKETER_REQUEST_STATUSES,
  MARKETER_REQUEST_STATUS_LABEL,
  type MarketerRequestRow,
} from "@/lib/schemas/marketer";

import { updateMarketerRequest, type ManageState } from "../actions";

// datetime-local 값으로 변환 (KST 보정 없이 로컬 표시)
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ManageForm({
  request,
  marketers,
}: {
  request: MarketerRequestRow;
  marketers: { id: string; display_name: string; category: string }[];
}) {
  const action = updateMarketerRequest.bind(null, request.id);
  const [state, formAction, pending] = useActionState<ManageState | null, FormData>(
    action,
    null,
  );

  return (
    <form action={formAction}>
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="status">상태</Label>
            <select
              id="status"
              name="status"
              defaultValue={request.status}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {MARKETER_REQUEST_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {MARKETER_REQUEST_STATUS_LABEL[s]?.label ?? s}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assigned_marketer_id">제안 마케터</Label>
            <select
              id="assigned_marketer_id"
              name="assigned_marketer_id"
              defaultValue={request.assigned_marketer_id ?? ""}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">— 선택 안 함 —</option>
              {marketers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name} ({m.category})
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              공개(published) 마케터만 목록에 표시됩니다.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interview_at">인터뷰 일시</Label>
            <Input
              id="interview_at"
              name="interview_at"
              type="datetime-local"
              defaultValue={toLocalInput(request.interview_at)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin_notes">운영 메모</Label>
            <Textarea
              id="admin_notes"
              name="admin_notes"
              rows={4}
              defaultValue={request.admin_notes ?? ""}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-3">
          {state?.ok ? (
            <p className="text-sm text-emerald-600">{state.message}</p>
          ) : state && !state.ok ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "저장 중..." : "저장"}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
