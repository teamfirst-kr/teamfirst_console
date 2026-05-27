import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const { count: pendingCount } = await supabase
    .from("partners")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  const { count: reviewingCount } = await supabase
    .from("partners")
    .select("id", { count: "exact", head: true })
    .eq("status", "reviewing");

  const { count: contractedCount } = await supabase
    .from("partners")
    .select("id", { count: "exact", head: true })
    .eq("status", "contracted");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-secondary">운영자 대시보드</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          입점·매칭·미팅·계약을 한 화면에서 관리하세요.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="신청 대기"
          value={String(pendingCount ?? 0)}
          hint="신규 검토 필요"
          href="/admin/partners?status=pending"
        />
        <StatCard
          label="검토/계약 중"
          value={String(reviewingCount ?? 0)}
          hint="계약서 발송 또는 응답 대기"
          href="/admin/partners?status=reviewing"
        />
        <StatCard
          label="입점 완료"
          value={String(contractedCount ?? 0)}
          hint="활성 파트너"
          href="/admin/partners?status=contracted"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>오늘의 할 일</CardTitle>
          <CardDescription>
            신청 대기 건이 있다면 우선 처리해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {pendingCount && pendingCount > 0 ? (
            <Link
              href="/admin/partners?status=pending"
              className="text-primary hover:underline"
            >
              신청 대기 {pendingCount}건 처리하기 →
            </Link>
          ) : (
            "현재 처리 대기 중인 항목이 없습니다."
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string;
  hint: string;
  href?: string;
}) {
  const body = (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm transition hover:shadow-md">
      <div className="bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">
        {label}
      </div>
      <div className="px-4 py-5">
        <p className="text-3xl font-bold text-secondary">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
