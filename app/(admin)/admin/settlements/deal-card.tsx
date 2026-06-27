"use client";

import { useActionState, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { guidesForPlatforms } from "@/lib/content/media-transfer";

import {
  createSettlement,
  setSettlementStatus,
  updateDeal,
  type SettleState,
} from "./actions";

export type SettlementView = {
  id: string;
  yearmonth: string;
  total_spend: number;
  partner_fee: number;
  teamfirst_share: number;
  status: string;
};

export type DealView = {
  id: string;
  brandName: string;
  partnerName: string;
  mediaType: string;
  platforms: string[];
  partnerFeeRate: number | null;
  teamfirstShareRate: number | null;
  status: string;
  contractUrl: string | null;
  invoiceProfile: {
    company_name: string;
    biz_reg_no: string;
    representative: string | null;
    invoice_email: string;
  } | null;
  settlements: SettlementView[];
};

const DEAL_STATUS = [
  { value: "contracted", label: "가계약" },
  { value: "active", label: "진계약(운영중)" },
  { value: "paused", label: "일시중지" },
  { value: "ended", label: "종료" },
];

const SETTLE_LABEL: Record<string, string> = {
  pending: "정산 대기",
  invoiced: "계산서 발행",
  paid: "입금 완료",
  disputed: "분쟁",
};

export function DealCard({ deal }: { deal: DealView }) {
  const dealAction = updateDeal.bind(null, deal.id);
  const [dealState, dealFormAction, dealPending] = useActionState<
    SettleState,
    FormData
  >(dealAction, null);

  const settleAction = createSettlement.bind(
    null,
    deal.id,
    deal.platforms,
    deal.partnerFeeRate,
    deal.teamfirstShareRate,
  );
  const [settleState, settleFormAction, settlePending] = useActionState<
    SettleState,
    FormData
  >(settleAction, null);

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-semibold text-foreground">{deal.brandName}</span>
          <span className="mx-1.5 text-muted-foreground">×</span>
          <span className="text-foreground">{deal.partnerName}</span>
        </div>
        <Badge variant={deal.status === "active" ? "success" : "default"}>
          {DEAL_STATUS.find((s) => s.value === deal.status)?.label ?? deal.status}
        </Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {deal.mediaType === "official" ? "공식대행" : "마크업"} ·{" "}
        {deal.platforms.join(", ")}
      </p>

      {/* 계약 수수료율 */}
      <form action={dealFormAction} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={`pf_${deal.id}`} className="text-xs">
            대행 수수료율 (%)
          </Label>
          <Input
            id={`pf_${deal.id}`}
            name="partner_fee_rate"
            inputMode="decimal"
            placeholder="예: 15"
            defaultValue={deal.partnerFeeRate ?? ""}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`tf_${deal.id}`} className="text-xs">
            팀퍼스트 몫 비율 (%)
          </Label>
          <Input
            id={`tf_${deal.id}`}
            name="teamfirst_share_rate"
            inputMode="decimal"
            placeholder="예: 20"
            defaultValue={deal.teamfirstShareRate ?? ""}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`st_${deal.id}`} className="text-xs">
            계약 상태
          </Label>
          <select
            id={`st_${deal.id}`}
            name="status"
            defaultValue={deal.status}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {DEAL_STATUS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label htmlFor={`cu_${deal.id}`} className="text-xs">
            대행계약서 URL
          </Label>
          <Input
            id={`cu_${deal.id}`}
            name="contract_url"
            placeholder="https://"
            defaultValue={deal.contractUrl ?? ""}
          />
        </div>
        <div className="sm:col-span-2 flex items-center gap-3">
          <Button type="submit" size="sm" disabled={dealPending}>
            {dealPending ? "저장 중..." : "계약 정보 저장"}
          </Button>
          {dealState?.ok ? (
            <span className="text-xs text-emerald-600">{dealState.message}</span>
          ) : dealState && !dealState.ok ? (
            <span className="text-xs text-destructive">{dealState.error}</span>
          ) : null}
        </div>
      </form>

      {/* 매체 이관 안내 */}
      <details className="mt-4 rounded-lg border bg-muted/30 p-3 text-xs">
        <summary className="cursor-pointer font-medium text-foreground">
          매체 이관(권한 위임) 안내
        </summary>
        <div className="mt-2 space-y-3">
          {guidesForPlatforms(deal.platforms).map((g) => (
            <div key={g.platform}>
              <p className="font-medium text-foreground">{g.label}</p>
              <ol className="ml-4 list-decimal text-muted-foreground">
                {g.steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </details>

      {/* 세금계산서 발행정보 */}
      <div className="mt-4 rounded-lg border bg-muted/40 p-3 text-xs">
        <p className="mb-1 font-medium text-foreground">세금계산서 발행정보</p>
        {deal.invoiceProfile ? (
          <div className="text-muted-foreground">
            {deal.invoiceProfile.company_name} · {deal.invoiceProfile.biz_reg_no}
            {deal.invoiceProfile.representative
              ? ` · ${deal.invoiceProfile.representative}`
              : ""}{" "}
            · {deal.invoiceProfile.invoice_email}
          </div>
        ) : (
          <div className="text-muted-foreground">
            대행사가 아직 발행정보를 입력하지 않았습니다.
          </div>
        )}
      </div>

      {/* 월별 정산 */}
      <div className="mt-4">
        <p className="mb-2 text-sm font-medium text-foreground">월별 정산</p>
        {deal.settlements.length > 0 ? (
          <div className="overflow-hidden rounded-lg border">
            <table className="w-full text-xs">
              <thead className="bg-muted/60 text-left text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">월</th>
                  <th className="px-3 py-2">총 소진</th>
                  <th className="px-3 py-2">대행수수료</th>
                  <th className="px-3 py-2">팀퍼스트</th>
                  <th className="px-3 py-2">상태</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {deal.settlements.map((s) => (
                  <SettlementRow key={s.id} s={s} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">아직 정산 내역이 없습니다.</p>
        )}

        {/* 정산 생성 */}
        <form
          action={settleFormAction}
          className="mt-3 rounded-lg border border-dashed p-3"
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor={`ym_${deal.id}`} className="text-xs">
                정산 월 (YYYY-MM)
              </Label>
              <Input
                id={`ym_${deal.id}`}
                name="yearmonth"
                placeholder="2026-06"
              />
            </div>
            {deal.platforms.map((p) => (
              <div key={p} className="space-y-1">
                <Label htmlFor={`spend_${deal.id}_${p}`} className="text-xs">
                  {p} 소진액 (원)
                </Label>
                <SpendInput id={`spend_${deal.id}_${p}`} name={`spend_${p}`} />
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Button type="submit" size="sm" variant="outline" disabled={settlePending}>
              {settlePending ? "생성 중..." : "월 정산 생성"}
            </Button>
            {settleState?.ok ? (
              <span className="text-xs text-emerald-600">{settleState.message}</span>
            ) : settleState && !settleState.ok ? (
              <span className="text-xs text-destructive">{settleState.error}</span>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}

function SettlementRow({ s }: { s: SettlementView }) {
  const [pending, startTransition] = useTransition();
  const next =
    s.status === "pending" ? "invoiced" : s.status === "invoiced" ? "paid" : null;
  return (
    <tr>
      <td className="px-3 py-2 font-medium">{s.yearmonth}</td>
      <td className="px-3 py-2">{s.total_spend.toLocaleString()}원</td>
      <td className="px-3 py-2">{s.partner_fee.toLocaleString()}원</td>
      <td className="px-3 py-2 font-medium text-primary">
        {s.teamfirst_share.toLocaleString()}원
      </td>
      <td className="px-3 py-2">{SETTLE_LABEL[s.status] ?? s.status}</td>
      <td className="px-3 py-2 text-right">
        {next ? (
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(() => setSettlementStatus(s.id, next))
            }
            className="text-primary hover:underline"
          >
            {next === "invoiced" ? "발행 처리" : "입금 처리"}
          </button>
        ) : (
          <span className="text-muted-foreground">완료</span>
        )}
      </td>
    </tr>
  );
}

function SpendInput({ id, name }: { id: string; name: string }) {
  const [display, setDisplay] = useState("");
  return (
    <Input
      id={id}
      name={name}
      inputMode="numeric"
      placeholder="0"
      value={display}
      onChange={(e) => {
        const d = e.target.value.replace(/[^\d]/g, "");
        setDisplay(d ? Number(d).toLocaleString("ko-KR") : "");
      }}
    />
  );
}
