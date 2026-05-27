import { PartnerApplicationForm } from "@/components/forms/partner-application-form";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "대행사 등록 신청 | TeamFirst",
  description:
    "TeamFirst 입점 파트너 대행사 등록 신청서. 검증된 대행사만 광고주에게 노출됩니다.",
};

export default function PartnerApplyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      <div className="space-y-3">
        <Badge variant="default">파트너 입점</Badge>
        <h1 className="text-3xl font-bold text-secondary">
          대행사 등록 신청서
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          TeamFirst는 검증된 대행사만 광고주에게 노출합니다. 아래 정보를
          입력해주시면 운영팀이 검토 후 영업일 기준 3일 이내에 답변드립니다.
          승인 시 글로싸인 전자계약서를 발송해드리며, 계약 완료 후 파트너
          계정이 발급됩니다.
        </p>
      </div>

      <PartnerApplicationForm />
    </div>
  );
}
