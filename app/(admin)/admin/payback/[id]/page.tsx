import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateText } from "@/components/date-text";
import { CredentialReveal } from "@/components/payback/credential-reveal";
import { createClient } from "@/lib/supabase/server";

import { ClientActions } from "../board-cards";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  agreement_sent: "약정 발송됨",
  agreement_signed: "서명 완료",
  transferring: "이관 진행",
  active: "활성",
  terminating: "해지 진행",
  terminated: "해지됨",
};

function maskAccount(v: string | null): string {
  if (!v) return "-";
  return v.length > 4 ? `${"*".repeat(Math.max(0, v.length - 4))}${v.slice(-4)}` : v;
}

export default async function PaybackClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("pb_clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!client) notFound();

  const [
    { data: medias },
    { data: agreement },
    { data: entitlements },
    { data: settlements },
    { data: audits },
  ] = await Promise.all([
    supabase
      .from("pb_media_accounts")
      .select("id, media, account_id, transfer_status, transferred_at")
      .eq("client_id", id),
    supabase
      .from("pb_agreements")
      .select("id, glosign_url, signed_at, all_solutions, consulting, status, rate_table_id")
      .eq("client_id", id)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("pb_entitlements")
      .select("active, solution_id")
      .eq("client_id", id),
    supabase
      .from("pb_monthly_settlements")
      .select("id, period, ad_spend_total, applied_rate, payback_total, status, invoice_status")
      .eq("client_id", id)
      .order("period", { ascending: false })
      .limit(12),
    supabase
      .from("pb_audit_logs")
      .select("action, diff, created_at")
      .eq("entity_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  // 사업자등록증 signed URL
  const license = client.business_license as { name: string; path: string } | null;
  let licenseUrl: string | null = null;
  if (license?.path) {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { data: signed } = await createAdminClient()
      .storage.from("pb-files")
      .createSignedUrl(license.path, 600);
    licenseUrl = signed?.signedUrl ?? null;
  }

  const [{ data: rateRow }, { data: solutions }] = await Promise.all([
    agreement?.rate_table_id
      ? supabase
          .from("pb_rate_tables")
          .select("version")
          .eq("id", agreement.rate_table_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("pb_solutions").select("id, name"),
  ]);
  const rateVersion = rateRow?.version ?? "-";
  const solutionName = new Map((solutions ?? []).map((s) => [s.id, s.name]));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/payback"
          className="text-xs text-muted-foreground hover:text-primary"
        >
          ← 페이백 파이프라인
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-secondary">{client.company_name}</h1>
          <Badge>{STATUS_LABEL[client.status] ?? client.status}</Badge>
          {!client.invoice_capable ? <Badge variant="muted">간이·면세</Badge> : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>프로필 · 계좌</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <p>사업자번호: <strong>{client.business_number}</strong></p>
            <p>대표자: {client.ceo_name ?? "-"}</p>
            <p>
              담당자: {client.contact_name} ({client.contact_email}
              {client.contact_phone ? ` · ${client.contact_phone}` : ""})
            </p>
            <p>
              계좌: {client.bank_name ?? "-"} {maskAccount(client.bank_account)}{" "}
              {client.bank_holder ? `(${client.bank_holder})` : ""}
            </p>
            <p>
              계산서 발행 이메일: {client.invoice_email ?? "-"}
            </p>
            <p>
              사업자등록증:{" "}
              {licenseUrl ? (
                <a
                  href={licenseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  📄 {license?.name ?? "다운로드"} ↗
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">미첨부</span>
              )}
            </p>
            <p className="flex items-center gap-1.5">
              솔루션 계정:{" "}
              {client.solution_login_id ? (
                <>
                  <strong>{client.solution_login_id}</strong>
                  {client.solution_login_pw ? (
                    <CredentialReveal value={client.solution_login_pw} />
                  ) : (
                    <span className="text-xs text-muted-foreground">(비밀번호 미입력)</span>
                  )}
                </>
              ) : (
                <span className="text-xs text-muted-foreground">
                  미입력 — 활성화 안내 시 수집 필요
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              등록 <DateText value={client.created_at} />
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>약정</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5 text-sm">
            <p>요율표 버전: <strong>{rateVersion}</strong> (체결 시점 스냅샷 — 개정 무관)</p>
            <p>
              옵션: {agreement?.all_solutions ? "솔루션 전체(−1%p) " : ""}
              {agreement?.consulting ? "컨설팅(−2%p)" : ""}
              {!agreement?.all_solutions && !agreement?.consulting ? "없음" : ""}
            </p>
            <p>
              서명: {agreement?.signed_at ? <DateText value={agreement.signed_at} /> : "대기 중"}
            </p>
            {agreement?.glosign_url ? (
              <a
                href={agreement.glosign_url}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                글로싸인 문서 열기 ↗
              </a>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>매체 계정 · 이관 상태</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientActions
            clientId={client.id}
            status={client.status}
            medias={(medias ?? []).map((m) => ({
              id: m.id,
              media: m.media,
              account_id: m.account_id,
              transfer_status: m.transfer_status,
            }))}
          />
          {client.status !== "transferring" && client.status !== "agreement_sent" ? (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {(medias ?? []).map((m) => (
                <li key={m.id}>
                  <span className="uppercase">{m.media}</span> · {m.account_id} ·{" "}
                  {m.transfer_status === "completed" ? "이관 완료" : m.transfer_status}
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>솔루션 이용권</CardTitle>
          </CardHeader>
          <CardContent>
            {(entitlements ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                활성화 시 자동 부여됩니다.
              </p>
            ) : (
              <ul className="space-y-1 text-sm">
                {(entitlements ?? []).map((e, i) => {
                  const name = solutionName.get(e.solution_id) ?? "솔루션";
                  return (
                    <li key={i} className="flex items-center gap-2">
                      <span>{name}</span>
                      {e.active ? (
                        <Badge variant="default">활성</Badge>
                      ) : (
                        <Badge variant="muted">잠금</Badge>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>최근 처리 이력</CardTitle>
          </CardHeader>
          <CardContent>
            {(audits ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">이력이 없습니다.</p>
            ) : (
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {(audits ?? []).map((a, i) => (
                  <li key={i}>
                    <DateText value={a.created_at} /> — {a.action}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>정산 이력</CardTitle>
        </CardHeader>
        <CardContent>
          {(settlements ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              아직 정산이 없습니다. 월 정산은 페이백 정산 화면에서 일괄 생성됩니다.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">기간</th>
                  <th className="px-3 py-2 text-right font-medium">광고비</th>
                  <th className="px-3 py-2 text-right font-medium">요율</th>
                  <th className="px-3 py-2 text-right font-medium">페이백(합계)</th>
                  <th className="px-3 py-2 font-medium">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(settlements ?? []).map((s) => (
                  <tr key={s.id}>
                    <td className="px-3 py-2">{s.period}</td>
                    <td className="px-3 py-2 text-right">
                      {s.ad_spend_total?.toLocaleString()}원
                    </td>
                    <td className="px-3 py-2 text-right">{s.applied_rate}%</td>
                    <td className="px-3 py-2 text-right font-medium">
                      {s.payback_total?.toLocaleString()}원
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="muted">
                        {s.status} / {s.invoice_status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
