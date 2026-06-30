"use client";

import { useMemo, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PARTNER_CATEGORIES } from "@/lib/schemas/partner-application";
import type { RequestStatus } from "@/types/database";

import { sendRfp, setRequestStatus, type RfpResult } from "./actions";

const CATEGORY_LABEL = Object.fromEntries(
  PARTNER_CATEGORIES.map((c) => [c.value, c.label]),
);

export type RfpPartnerOption = {
  id: string;
  name: string;
  categories: string[];
};

export function RfpPanel({
  requestId,
  status,
  partners,
  requestChannels,
  notifiedIds,
  alreadySent,
}: {
  requestId: string;
  status: RequestStatus;
  partners: RfpPartnerOption[];
  requestChannels: string[];
  notifiedIds: string[];
  alreadySent: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<RfpResult | null>(null);
  // 기본값: 모두 선택
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(partners.map((p) => p.id)),
  );

  const notifiedSet = useMemo(() => new Set(notifiedIds), [notifiedIds]);
  const channelSet = useMemo(() => new Set(requestChannels), [requestChannels]);

  function run(fn: () => Promise<RfpResult>) {
    setResult(null);
    startTransition(async () => setResult(await fn()));
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function selectAll() {
    setSelected(new Set(partners.map((p) => p.id)));
  }
  function clearAll() {
    setSelected(new Set());
  }
  function selectMatching() {
    setSelected(
      new Set(
        partners
          .filter((p) => p.categories.some((c) => channelSet.has(c)))
          .map((p) => p.id),
      ),
    );
  }

  const total = partners.length;
  const count = selected.size;
  const canSend = count > 0 && !pending;
  const sendLabel = alreadySent ? "RFP 재발송" : "RFP 발송";

  return (
    <Card>
      <CardHeader>
        <CardTitle>RFP 발송</CardTitle>
        <CardDescription>
          입점 완료 대행사 중 발송할 곳을 선택하세요. 기본값은 전원 선택입니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">
            발송 대상 대행사가 없습니다. 먼저 파트너 입점을 완료해주세요.
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm">
                발송 대상:{" "}
                <strong className="text-primary">{count}</strong>
                <span className="text-muted-foreground"> / {total}개사</span>
              </p>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={selectAll}
                  className="rounded-md border border-input px-2 py-1 text-xs hover:bg-accent"
                >
                  전체 선택
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded-md border border-input px-2 py-1 text-xs hover:bg-accent"
                >
                  전체 해제
                </button>
                {requestChannels.length > 0 ? (
                  <button
                    type="button"
                    onClick={selectMatching}
                    className="rounded-md border border-input px-2 py-1 text-xs hover:bg-accent"
                  >
                    요청 매체 일치만
                  </button>
                ) : null}
              </div>
            </div>

            <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-input p-1.5">
              {partners.map((p) => {
                const on = selected.has(p.id);
                return (
                  <label
                    key={p.id}
                    className="flex cursor-pointer items-start gap-2.5 rounded-md p-2 text-sm hover:bg-accent"
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(p.id)}
                      className="mt-0.5 h-4 w-4 shrink-0"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="font-medium text-foreground">
                          {p.name}
                        </span>
                        {notifiedSet.has(p.id) ? (
                          <Badge variant="muted">발송됨</Badge>
                        ) : null}
                      </span>
                      {p.categories.length > 0 ? (
                        <span className="mt-0.5 flex flex-wrap gap-1">
                          {p.categories.map((c) => (
                            <span
                              key={c}
                              className={
                                "rounded px-1.5 py-0.5 text-[11px] " +
                                (channelSet.has(c)
                                  ? "bg-primary/10 text-primary"
                                  : "bg-muted text-muted-foreground")
                              }
                            >
                              {CATEGORY_LABEL[c] ?? c}
                            </span>
                          ))}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>

            <Button
              className="w-full"
              disabled={!canSend}
              onClick={() => run(() => sendRfp(requestId, [...selected]))}
            >
              {pending ? "처리 중..." : `${sendLabel} (${count}개사)`}
            </Button>
          </>
        )}

        {status === "rfp_sent" ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={pending}
            onClick={() => run(() => setRequestStatus(requestId, "collecting"))}
          >
            지원 수집 단계로 전환
          </Button>
        ) : null}

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

        <p className="text-xs text-muted-foreground">
          발송 시 선택한 대행사에게만 RFP 안내 메일과 인앱 알림이 전송됩니다.
        </p>
      </CardContent>
    </Card>
  );
}
