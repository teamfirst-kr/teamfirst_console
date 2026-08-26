import Link from "next/link";

import { createAdminClient } from "@/lib/supabase/admin";

import { ApplyFollowupForm } from "./followup-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "추가 정보 입력 — TeamFirst 페이백",
  robots: { index: false },
};

// 접수 메일(E1)·신청 완료 화면에서 열리는 추가 정보 제출 페이지 (토큰 링크)
export default async function ApplyFollowupPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const valid = /^[0-9a-f-]{36}$/i.test(token);

  const app = valid
    ? (
        await createAdminClient()
          .from("pb_applications")
          .select(
            "id, company_name, contact_name, business_license, invoice_email, bank_name, bank_account, bank_holder, solution_login_id, followup_submitted_at, status",
          )
          .eq("followup_token", token)
          .maybeSingle()
      ).data
    : null;

  if (!app) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="text-3xl">🔗</p>
        <h1 className="mt-4 text-xl font-bold text-secondary">
          링크를 확인할 수 없습니다
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          접수 확인 메일의 버튼으로 다시 접속하시거나, 메일 회신으로 정보를
          보내주세요.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm text-primary hover:underline">
          메인으로 돌아가기 →
        </Link>
      </div>
    );
  }

  const hasLicense = !!(app.business_license as { path?: string } | null)?.path;

  return (
    <div className="mx-auto max-w-xl px-6 py-14">
      <h1 className="text-2xl font-bold text-secondary">추가 정보 입력</h1>
      <p className="mt-2 break-keep text-sm leading-relaxed text-muted-foreground">
        <strong className="text-foreground">{app.company_name}</strong>님의 페이백
        신청이 접수되었습니다. 아래 정보를 입력해주시면 검토가 빠르게
        진행됩니다.
        {app.followup_submitted_at
          ? " (이미 제출하셨습니다 — 다시 제출하면 내용이 갱신됩니다)"
          : ""}
      </p>
      <div className="mt-8 rounded-2xl border bg-card p-6 shadow-sm md:p-8">
        <ApplyFollowupForm
          token={token}
          hasLicense={hasLicense}
          defaults={{
            invoice_email: app.invoice_email ?? "",
            bank_name: app.bank_name ?? "",
            bank_account: app.bank_account ?? "",
            bank_holder: app.bank_holder ?? "",
            solution_login_id: app.solution_login_id ?? "",
          }}
        />
      </div>
    </div>
  );
}
