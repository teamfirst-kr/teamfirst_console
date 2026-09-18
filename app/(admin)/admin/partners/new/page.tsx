import Link from "next/link";

import { NewPartnerForm } from "./new-partner-form";

export const dynamic = "force-dynamic";

// 신규 대행사 직접 등록 — 공개 등록신청서(/partner/apply)를 거치지 않은
// 기존/오프라인 협의 대행사를 운영자가 바로 등록한다. 계정 발급은 상세 화면에서.
export default function NewPartnerPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/partners" className="text-xs text-muted-foreground hover:underline">
          ← 파트너 대행사
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-secondary">신규 대행사 직접 등록</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          공개 등록신청서 없이 운영자가 대행사를 직접 등록합니다. 로그인 계정 발급은 등록 후
          상세 화면의 &quot;계정 발급&quot;에서 진행하세요.
        </p>
      </div>

      <NewPartnerForm />
    </div>
  );
}
