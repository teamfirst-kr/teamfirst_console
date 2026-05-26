import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">운영자 대시보드</h1>
        <p className="text-sm text-muted-foreground">
          신청·매칭·미팅·계약을 한 화면에서 관리하세요.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>입점 신청</CardTitle>
            <CardDescription>대기 중 0건</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            2주차에 활성화됩니다.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>매칭 요청</CardTitle>
            <CardDescription>진행 중 0건</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            3주차에 활성화됩니다.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>이번 주 미팅</CardTitle>
            <CardDescription>0건</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            6주차에 활성화됩니다.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
