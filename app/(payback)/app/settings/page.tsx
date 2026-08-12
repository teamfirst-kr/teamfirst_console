import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPbClientId } from "@/lib/auth";

export const dynamic = "force-dynamic";

function maskAccount(v: string | null): string {
  if (!v) return "미등록";
  return v.length > 4 ? `${"*".repeat(Math.max(0, v.length - 4))}${v.slice(-4)}` : v;
}

export default async function PortalSettingsPage() {
  const supabase = await createClient();
  const clientId = await getCurrentPbClientId();
  if (!clientId) return null;

  const { data: client } = await supabase
    .from("pb_clients")
    .select(
      "company_name, business_number, ceo_name, contact_name, contact_email, contact_phone, invoice_capable, bank_name, bank_account, bank_holder, solution_login_id, invoice_email",
    )
    .eq("id", clientId)
    .maybeSingle();
  if (!client) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">설정</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          등록 정보 열람 화면입니다. 변경이 필요하면 아래 안내대로 요청해주세요.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>회사 · 담당자</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <p>회사명: <strong>{client.company_name}</strong></p>
          <p>사업자등록번호: {client.business_number}</p>
          <p>대표자: {client.ceo_name ?? "-"}</p>
          <p>
            담당자: {client.contact_name} ({client.contact_email}
            {client.contact_phone ? ` · ${client.contact_phone}` : ""})
          </p>
          <p>
            세금계산서:{" "}
            {client.invoice_capable
              ? "발행 가능 (일반과세)"
              : "발행 불가 (간이·면세) — 공급가액만 지급"}
          </p>
          {client.invoice_capable ? (
            <p>계산서 발행 이메일: {client.invoice_email ?? "미등록"}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>솔루션 접속 계정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <p>
            ID:{" "}
            {client.solution_login_id ? (
              <strong>{client.solution_login_id}</strong>
            ) : (
              <span className="text-muted-foreground">미등록 — 활성화 시 안내드립니다</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            비밀번호는 보안을 위해 표시하지 않습니다. 분실 시 아래 변경 요청 절차로
            재설정을 요청해주세요.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>페이백 수령 계좌</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-sm">
          <p>
            {client.bank_name ?? "미등록"} {maskAccount(client.bank_account)}{" "}
            {client.bank_holder ? `(예금주: ${client.bank_holder})` : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            보안을 위해 계좌번호는 뒤 4자리만 표시됩니다.
          </p>
        </CardContent>
      </Card>

      <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">정보 변경 요청</strong>
        <p className="mt-1 leading-relaxed">
          담당자·연락처·계좌 변경은 본인 확인을 위해 관리자 승인으로 처리됩니다.{" "}
          <a href="mailto:team1st2025@gmail.com" className="text-primary hover:underline">
            team1st2025@gmail.com
          </a>
          으로 회사명·사업자번호와 함께 변경 내용을 보내주시면 영업일 기준 1일 내
          반영됩니다. (특히 계좌 변경은 사업자등록증 상호와 예금주 일치 확인 후
          처리됩니다)
        </p>
      </div>
    </div>
  );
}
