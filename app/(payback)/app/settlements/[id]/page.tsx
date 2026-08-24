import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPbClientId } from "@/lib/auth";
import {
  addBusinessDays,
  periodLastDay,
  todayKst,
} from "@/lib/payback-domain";
import type { PbSettlementRow } from "@/types/database";

import { DisputeButton } from "./dispute-button";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

export default async function StatementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const clientId = await getCurrentPbClientId();
  if (!clientId) notFound();

  const [{ data: sRow }, { data: client }] = await Promise.all([
    supabase.from("pb_monthly_settlements").select("*").eq("id", id).maybeSingle(),
    supabase.from("pb_clients").select("company_name, business_number, invoice_capable").eq("id", clientId).maybeSingle(),
  ]);
  const s = sRow as PbSettlementRow | null;
  if (!s || s.client_id !== clientId || !["confirmed", "paid"].includes(s.status)) {
    notFound();
  }

  const details = (s.spend_details ?? []) as { media: string; product: string; amount: number }[];
  const writeDate = periodLastDay(s.period);
  const [y, m] = s.period.split("-");

  const disputeOpen =
    s.status === "confirmed" &&
    !s.dispute_flag &&
    s.confirmed_at !== null &&
    todayKst() <= addBusinessDays(s.confirmed_at.slice(0, 10), 3);
  const disputeDeadline = s.confirmed_at
    ? addBusinessDays(s.confirmed_at.slice(0, 10), 3)
    : "";

  const dday = s.invoice_due
    ? Math.ceil(
        (new Date(`${s.invoice_due}T00:00:00+09:00`).getTime() -
          new Date(`${todayKst()}T00:00:00+09:00`).getTime()) /
          86_400_000,
      )
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/app/settlements" className="text-xs text-muted-foreground hover:text-primary">
          ← 정산 내역
        </Link>
        <PrintButton />
      </div>

      {/* 정산서 본문 (인쇄 대상) */}
      <div className="rounded-2xl border bg-card p-8 shadow-sm print:border-0 print:shadow-none">
        <div className="flex items-start justify-between border-b pb-5">
          <div>
            <p className="text-xs font-bold tracking-widest text-muted-foreground">
              TEAMFIRST PAYBACK STATEMENT
            </p>
            <h1 className="mt-1 text-xl font-extrabold text-secondary">
              {y}년 {Number(m)}월 페이백 정산서
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{s.statement_no}</p>
          </div>
          <Badge variant={s.status === "paid" ? "default" : "muted"}>
            {s.status === "paid" ? "지급 완료" : "확정"}
          </Badge>
        </div>

        <dl className="mt-5 space-y-2.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">고객사</dt>
            <dd className="font-medium">
              {client?.company_name} ({client?.business_number})
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">실집행 광고비 (VAT·무상쿠폰 제외)</dt>
            <dd className="font-medium">{s.ad_spend_total.toLocaleString()}원</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">광고비 구간</dt>
            <dd className="font-medium">{s.tier_label}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">기본 요율</dt>
            <dd className="font-medium">{Number(s.base_rate)}%</dd>
          </div>
          {Number(s.modifier_total) > 0 ? (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">옵션 조정</dt>
              <dd className="font-medium">−{Number(s.modifier_total)}%p</dd>
            </div>
          ) : null}
          {Number(s.modifier_total) < 0 ? (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">🎁 첫 달 프로모션</dt>
              <dd className="font-medium text-emerald-600">
                +{-Number(s.modifier_total)}%p (옵션 무료 포함)
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between border-t pt-2.5 text-base">
            <dt className="font-semibold">적용 요율</dt>
            <dd className="font-extrabold text-primary">{Number(s.applied_rate)}%</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">페이백 (공급가액)</dt>
            <dd className="font-semibold">{s.payback_supply.toLocaleString()}원</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">부가세 (10%)</dt>
            <dd className="font-semibold">{s.payback_vat.toLocaleString()}원</dd>
          </div>
          <div className="flex justify-between border-t pt-2.5 text-lg">
            <dt className="font-bold text-secondary">지급 합계</dt>
            <dd className="font-extrabold text-secondary">
              {s.payback_total.toLocaleString()}원
            </dd>
          </div>
        </dl>

        {details.length > 0 ? (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              매체별 내역
            </p>
            <table className="mt-2 w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">매체</th>
                  <th className="px-3 py-2 font-medium">상품</th>
                  <th className="px-3 py-2 text-right font-medium">광고비</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {details.map((d, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 uppercase">{d.media}</td>
                    <td className="px-3 py-2">{d.product || "-"}</td>
                    <td className="px-3 py-2 text-right">{d.amount.toLocaleString()}원</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {/* 세무 고지 (부록 A ②③ 원문 — 수정 금지) */}
        <div className="mt-6 rounded-lg bg-muted/40 p-4 text-[11px] leading-relaxed text-muted-foreground">
          <p>
            ② 페이백은 광고주가 발행하는 세금계산서(품목: 판매촉진비,
            공급가액=페이백액) 확인 후 지급되며, 부가가치세는 페이백과 함께 별도
            지급됩니다
          </p>
          <p>
            ③ 세금계산서 발행 기한은 익월 10일이며, 기한 내 미발행 시 지급이 발행
            확인월로 순연됩니다 — 페이백 권리는 소멸하지 않습니다
          </p>
        </div>
      </div>

      {/* 계산서 발행 가이드 (pending/overdue) — 부록 B 원문 */}
      {["pending", "overdue"].includes(s.invoice_status) ? (
        <div
          className={`rounded-2xl border p-6 print:hidden ${
            s.invoice_status === "overdue"
              ? "border-amber-300 bg-amber-50"
              : "border-primary/20 bg-primary/5"
          }`}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-secondary">세금계산서 발행 가이드</h2>
            {dday !== null ? (
              <Badge variant={dday < 0 ? "destructive" : "default"}>
                {dday >= 0 ? `기한 D-${dday}` : `기한 ${-dday}일 경과`}
              </Badge>
            ) : null}
          </div>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
            <li>
              발행 방향: 귀사(공급자) → 팀퍼스트(공급받는자), <strong>청구</strong> 구분
            </li>
            <li>
              품목: <strong>판매촉진비</strong>
            </li>
            <li>
              공급가액: 정산서의 페이백 금액{" "}
              <strong>({s.payback_supply.toLocaleString()}원)</strong> / 세액: 공급가액의
              10%
            </li>
            <li>
              작성일자: <strong>정산월 말일</strong> ({writeDate})
            </li>
            <li>
              발행 기한: <strong>익월 10일 ({s.invoice_due})</strong> — 기한 경과 시
              지급이 발행 확인월로 순연되며, 지연 발행에 따른 가산세는 발행 사업자에게
              발생할 수 있습니다
            </li>
            <li>
              세금계산서 발행이 어려운 간이과세·면세사업자는 별도 안내드리는
              절차(계산서 없이 공급가액 지급)로 진행됩니다
            </li>
          </ul>
        </div>
      ) : null}

      {s.dispute_flag ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 print:hidden">
          이의신청이 접수되어 담당자가 확인 중입니다.
        </p>
      ) : disputeOpen ? (
        <DisputeButton settlementId={s.id} deadline={disputeDeadline} />
      ) : null}
    </div>
  );
}
