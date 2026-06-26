import { Badge } from "@/components/ui/badge";
import { MatchingRequestWizard } from "@/components/forms/matching-request-wizard";

import { loadDraft } from "./actions";

export const metadata = {
  title: "새 매칭 요청 | TeamFirst",
};

export const dynamic = "force-dynamic";

export default async function NewMatchingRequestPage() {
  const draft = await loadDraft();

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-3">
        <Badge variant="default">대행사 매칭 요청</Badge>
        <h1 className="text-2xl font-bold text-secondary">대행사 매칭 요청서</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          단계별로 작성하시면 자동으로 임시저장되어, 중간에 나가셔도 이어서 작성할
          수 있습니다. 제출하시면 입점 기준을 통과한 검증된 대행사들에게 RFP가
          발송됩니다.
        </p>
      </div>
      <MatchingRequestWizard draft={draft} />
    </div>
  );
}
