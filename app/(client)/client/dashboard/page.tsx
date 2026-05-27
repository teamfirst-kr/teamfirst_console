import Link from "next/link";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function ClientDashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-secondary">광고주 대시보드</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          매칭 요청 현황과 후보 대행사를 한 곳에서 확인하세요.
        </p>
      </div>
      <EmptyState
        icon={<FileText className="h-5 w-5" />}
        title="아직 매칭 요청이 없습니다"
        description="첫 매칭 요청을 작성하시면 RFP가 검증된 파트너 대행사에 발송됩니다."
        action={
          <Button asChild disabled>
            <Link href="/client/request/new">새 매칭 요청 (3주차 활성화)</Link>
          </Button>
        }
      />
    </div>
  );
}
