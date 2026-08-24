import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPbClientId } from "@/lib/auth";
import { effectiveOptionsForPeriod, currentPeriodKst, type OptionChange } from "@/lib/payback-domain";
import type { PbSettlementRow } from "@/types/database";

export const dynamic = "force-dynamic";

const TRANSFER_LABEL: Record<string, string> = {
  pending: "대기",
  in_progress: "진행 중",
  completed: "완료",
  released: "해제",
};

export default async function PaybackDashboardPage() {
  const supabase = await createClient();
  const clientId = await getCurrentPbClientId();
  if (!clientId) {
    return (
      <p className="text-sm text-muted-foreground">
        고객사 정보를 찾을 수 없습니다. 관리자에게 문의해주세요.
      </p>
    );
  }

  const [{ data: client }, { data: agreement }, { data: medias }] =
    await Promise.all([
      supabase.from("pb_clients").select("*").eq("id", clientId).maybeSingle(),
      supabase
        .from("pb_agreements")
        .select("id, glosign_url, signed_at, all_solutions, consulting, rate_table_id")
        .eq("client_id", clientId)
        .eq("status", "active")
        .maybeSingle(),
      supabase
        .from("pb_media_accounts")
        .select("media, account_id, transfer_status")
        .eq("client_id", clientId),
    ]);
  if (!client) return null;

  // ── 온보딩 (active 이전) ──────────────────────────────────────────
  if (client.status !== "active") {
    const signed = !!agreement?.signed_at;
    const allTransferred =
      (medias ?? []).length > 0 &&
      (medias ?? []).every((m) => m.transfer_status === "completed");
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary">온보딩 진행 중</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            아래 단계가 완료되면 페이백이 활성화됩니다.
          </p>
        </div>
        <ol className="space-y-3">
          <li className={`rounded-xl border p-5 ${signed ? "border-emerald-200 bg-emerald-50/50" : "bg-card"}`}>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-secondary">① 약정 서명 (전자계약)</p>
              <Badge variant={signed ? "default" : "muted"}>
                {signed ? "완료" : "대기 중"}
              </Badge>
            </div>
            {!signed && agreement?.glosign_url ? (
              <a
                href={agreement.glosign_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm text-primary hover:underline"
              >
                글로싸인에서 약정서 확인·서명하기 ↗
              </a>
            ) : null}
          </li>
          <li className={`rounded-xl border p-5 ${allTransferred ? "border-emerald-200 bg-emerald-50/50" : "bg-card"}`}>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-secondary">② 매체별 대행권 지정</p>
              <Badge variant={allTransferred ? "default" : "muted"}>
                {allTransferred ? "완료" : "진행 중"}
              </Badge>
            </div>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              {(medias ?? []).map((m) => (
                <p key={m.account_id}>
                  <span className="uppercase">{m.media}</span> · {m.account_id} —{" "}
                  {TRANSFER_LABEL[m.transfer_status]}
                </p>
              ))}
            </div>
            <div className="mt-3 rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
              <strong>네이버 기준 가이드:</strong> 광고시스템 → 도구 → 광고 담당자(대행사)
              관리 → 대행사 검색에서 <strong>팀퍼스트</strong> 선택 → 위임 요청.
              팀퍼스트가 수락하면 자동으로 완료 처리됩니다. 계정 소유권과 운영 권한은
              그대로 유지됩니다.
            </div>
          </li>
          <li className="rounded-xl border bg-card p-5">
            <p className="font-semibold text-secondary">③ 활성화 대기</p>
            <p className="mt-1 text-sm text-muted-foreground">
              위 두 단계가 완료되면 팀퍼스트가 확인 후 활성화합니다. 활성화 월의
              실집행 광고비부터 페이백이 산정됩니다.
            </p>
          </li>
        </ol>
      </div>
    );
  }

  // ── 활성 대시보드 ─────────────────────────────────────────────────
  const [{ data: settlements }, { data: rateRow }, { data: changes }, { data: entitlements }, { data: solutions }] =
    await Promise.all([
      supabase
        .from("pb_monthly_settlements")
        .select("*")
        .eq("client_id", clientId)
        .neq("status", "canceled")
        .order("period", { ascending: false })
        .limit(24),
      agreement?.rate_table_id
        ? supabase
            .from("pb_rate_tables")
            .select("version")
            .eq("id", agreement.rate_table_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      agreement
        ? supabase
            .from("pb_option_changes")
            .select("field, new_value, effective_from, applied_at, reason")
            .eq("agreement_id", agreement.id)
        : Promise.resolve({ data: [] }),
      supabase
        .from("pb_entitlements")
        .select("solution_id, active")
        .eq("client_id", clientId),
      supabase.from("pb_solutions").select("id, name, description, url, sort").order("sort"),
    ]);

  const rows = (settlements ?? []) as PbSettlementRow[];
  const latestConfirmed = rows.find((s) => s.status === "confirmed" || s.status === "paid");
  const pendingPay = rows.filter((s) => s.status === "confirmed");
  const pendingTotal = pendingPay.reduce((sum, s) => sum + s.payback_total, 0);
  const overdue = rows.filter((s) => s.invoice_status === "overdue");
  const overdueTotal = overdue.reduce((sum, s) => sum + s.payback_total, 0);

  const currentOptions = agreement
    ? effectiveOptionsForPeriod(
        { all_solutions: agreement.all_solutions, consulting: agreement.consulting },
        ((changes ?? []) as OptionChange[]),
        currentPeriodKst(),
      )
    : { all_solutions: false, consulting: false };

  const entitlementBySolution = new Map(
    (entitlements ?? []).map((e) => [e.solution_id, e.active]),
  );
  const autoTermPending = (changes ?? []).some(
    (c) => c.reason === "auto_consulting_termination" && !c.applied_at,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">{client.company_name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">페이백 대시보드</p>
      </div>

      {overdueTotal > 0 ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          <strong>보류(이월) 누계 {overdueTotal.toLocaleString()}원</strong> — 세금계산서
          발행이 확인되면 차기 지급일에 합산 지급됩니다. 페이백 권리는 소멸하지
          않습니다.{" "}
          <Link href="/app/settlements" className="font-semibold underline">
            발행 정보 확인 →
          </Link>
        </div>
      ) : null}
      {autoTermPending ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          월 광고비 2개월 연속 700만 원 미만으로 <strong>컨설팅 옵션이 익월 1일 자동
          해제될 예정</strong>입니다.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">내 약정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <p>
              요율표 <strong>{rateRow?.version ?? "-"}</strong>
            </p>
            <p className="text-muted-foreground">
              이번 달 옵션:{" "}
              {[
                currentOptions.all_solutions ? "솔루션 전체(−1%p)" : null,
                currentOptions.consulting ? "컨설팅(−1%p)" : null,
              ]
                .filter(Boolean)
                .join(" · ") || "없음"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              현재 구간·요율{" "}
              <span className="text-xs font-normal text-muted-foreground">
                (전월 정산 기준)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {latestConfirmed ? (
              <>
                <p className="text-2xl font-extrabold text-primary">
                  {Number(latestConfirmed.applied_rate)}%
                </p>
                <p className="mt-1 text-muted-foreground">
                  {latestConfirmed.period} · {latestConfirmed.tier_label} · 광고비{" "}
                  {latestConfirmed.ad_spend_total.toLocaleString()}원
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">
                첫 정산이 확정되면 표시됩니다.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">다음 지급 예정</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="text-2xl font-extrabold text-secondary">
              {pendingTotal.toLocaleString()}원
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {pendingPay.slice(0, 4).map((s) => (
                <Badge key={s.id} variant="muted">
                  {s.period}{" "}
                  {s.invoice_status === "pending"
                    ? "· 계산서 대기"
                    : s.invoice_status === "overdue"
                      ? "· 보류"
                      : s.reconciled
                        ? "· 지급 대기"
                        : "· 대사 대기"}
                </Badge>
              ))}
              {pendingPay.length === 0 ? (
                <span className="text-muted-foreground">지급 대기 건이 없습니다.</span>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">솔루션 바로가기</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(solutions ?? []).map((s) => {
            const active = entitlementBySolution.get(s.id) === true;
            return (
              <div
                key={s.id}
                className={`rounded-xl border p-4 ${active ? "bg-card" : "bg-muted/40 opacity-60"}`}
              >
                <p className="font-semibold text-secondary">{s.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.description}</p>
                {active && s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs font-medium text-primary hover:underline"
                  >
                    바로가기 ↗
                  </a>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {active ? "오픈 준비 중" : "잠금 — 전체 이용 옵션에서 오픈"}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
