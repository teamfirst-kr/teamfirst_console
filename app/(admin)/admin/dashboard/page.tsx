import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-secondary">운영자 대시보드</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          입점·매칭·미팅·계약을 한 화면에서 관리하세요.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="입점 신청 대기" value="0" hint="2주차에 활성화" />
        <StatCard label="진행 중 매칭" value="0" hint="3주차에 활성화" />
        <StatCard label="이번 주 미팅" value="0" hint="6주차에 활성화" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>오늘의 할 일</CardTitle>
          <CardDescription>
            새 입점 신청, 미응답 매칭, 임박한 미팅이 여기에 표시됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          1주차 셋업 단계. 다음 PR에서 운영자 신청 목록 화면이 추가됩니다.
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
      <div className="bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">
        {label}
      </div>
      <div className="px-4 py-5">
        <p className="text-3xl font-bold text-secondary">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </div>
    </div>
  );
}
