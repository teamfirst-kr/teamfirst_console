import { Badge } from "@/components/ui/badge";
import { MatchingRequestForm } from "@/components/forms/matching-request-form";

export const metadata = {
  title: "새 매칭 요청 | TeamFirst",
};

export default function NewMatchingRequestPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-3">
        <Badge variant="default">대행사 매칭 요청</Badge>
        <h1 className="text-2xl font-bold text-secondary">대행사 매칭 요청서</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          요청서를 제출하시면 입점 기준을 통과한 검증된 대행사들에게 RFP가
          발송됩니다. 관심 있는 대행사가 지원하면 운영팀이 상위 후보를
          선정해 전달해드립니다.
        </p>
      </div>
      <MatchingRequestForm />
    </div>
  );
}
