import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ClientDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">광고주 대시보드</h1>
        <p className="text-sm text-muted-foreground">
          매칭 요청 현황과 후보 대행사를 한 곳에서 확인하세요.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>아직 매칭 요청이 없습니다</CardTitle>
          <CardDescription>
            상단의 &ldquo;새 매칭 요청&rdquo;에서 첫 요청을 작성해보세요. (3주차 산출물)
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          1주차 셋업 단계입니다. 매칭 요청서 폼은 3주차에 추가됩니다.
        </CardContent>
      </Card>
    </div>
  );
}
