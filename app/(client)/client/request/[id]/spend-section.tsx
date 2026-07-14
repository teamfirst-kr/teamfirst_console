"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AD_PLATFORM_OPTIONS } from "@/lib/schemas/ad-spend";

import { saveAdSpend } from "./spend-actions";

export type SpendRow = {
  period: string;
  amounts: Record<string, number>;
};

export function SpendSection({
  requestId,
  existing,
}: {
  requestId: string;
  existing: SpendRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function onSubmit(formData: FormData) {
    setMsg(null);
    startTransition(async () => {
      const r = await saveAdSpend(requestId, formData);
      setMsg({ ok: r.ok, text: r.ok ? r.message : r.error });
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>지난 3개월 광고비</CardTitle>
        <CardDescription>
          후보 대행사의 분석을 위해 매체별 월 소진액을 입력해주세요. 분석권한을
          부여한 대행사만 열람할 수 있습니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {existing.length > 0 ? (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">기간</th>
                  <th className="px-3 py-2">매체별 소진액</th>
                  <th className="px-3 py-2 text-right">합계</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {existing
                  .slice()
                  .sort((a, b) => b.period.localeCompare(a.period))
                  .map((row) => {
                    const total = Object.values(row.amounts).reduce(
                      (s, v) => s + v,
                      0,
                    );
                    return (
                      <tr key={row.period}>
                        <td className="px-3 py-2 font-medium">{row.period}</td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {Object.entries(row.amounts)
                            .map(([k, v]) => {
                              const label =
                                AD_PLATFORM_OPTIONS.find((p) => p.value === k)
                                  ?.label ?? k;
                              return `${label} ${v.toLocaleString()}`;
                            })
                            .join(" · ")}
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {total.toLocaleString()}원
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        ) : null}

        <form action={onSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="period_yearmonth">기간 (YYYY-MM)</Label>
            <Input
              id="period_yearmonth"
              name="period_yearmonth"
              placeholder="2026-05"
              className="max-w-[160px]"
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {AD_PLATFORM_OPTIONS.map((p) => (
              <div key={p.value} className="space-y-1">
                <Label htmlFor={`amount_${p.value}`} className="text-xs">
                  {p.label} (원)
                </Label>
                <Input
                  id={`amount_${p.value}`}
                  name={`amount_${p.value}`}
                  type="number"
                  min={0}
                  step={10000}
                />
              </div>
            ))}
          </div>
          {msg ? (
            <p
              className={
                msg.ok ? "text-sm text-emerald-600" : "text-sm text-destructive"
              }
            >
              {msg.text}
            </p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "저장 중..." : "이 달 광고비 저장"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
