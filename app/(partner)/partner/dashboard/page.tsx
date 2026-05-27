import { Inbox } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";

export default function PartnerDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-secondary">파트너 대시보드</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          도착한 RFP와 진행 중인 미팅을 확인하세요.
        </p>
      </div>
      <EmptyState
        icon={<Inbox className="h-5 w-5" />}
        title="잠시만 기다려주세요"
        description="적합한 매칭 요청이 들어오면 RFP가 자동으로 도착합니다. (4주차에 RFP 목록 활성화)"
      />
    </div>
  );
}
