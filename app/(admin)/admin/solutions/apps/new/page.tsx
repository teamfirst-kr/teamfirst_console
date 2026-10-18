import Link from "next/link";

import { AppForm } from "../app-form";

export const dynamic = "force-dynamic";

export default function NewMarketAppPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin/solutions/apps" className="text-xs text-muted-foreground hover:underline">
          ← 앱 카탈로그
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-secondary">앱 추가</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          사내 솔루션을 마켓 앱으로 등록합니다. 준비 중이면 &lsquo;출시 예정&rsquo;으로 먼저 노출하고, 계정 발급이
          가능해지면 &lsquo;이용 가능&rsquo;으로 바꾸세요.
        </p>
      </div>
      <AppForm />
    </div>
  );
}
