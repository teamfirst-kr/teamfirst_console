import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PartnerDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary">파트너 대시보드</h1>
        <p className="text-sm text-muted-foreground">
          도착한 RFP와 진행 중인 미팅을 확인하세요.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>아직 도착한 RFP가 없습니다</CardTitle>
          <CardDescription>
            RFP 목록은 4주차 산출물에 포함됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          1주차 셋업 단계입니다.
        </CardContent>
      </Card>
    </div>
  );
}
