import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "등록 신청 완료 | TeamFirst",
};

export default function PartnerApplySuccessPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <Card>
        <CardHeader className="items-center text-center space-y-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">등록 신청이 접수됐습니다</CardTitle>
          <CardDescription className="leading-relaxed">
            영업일 기준 3일 이내에 검토 결과를 작성하신 이메일로 안내드립니다.
            <br />
            승인 시 글로싸인 전자계약서 링크가 함께 발송됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/60 p-4 text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">다음 단계 안내</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>운영팀 서류 검토 (영업일 3일 이내)</li>
              <li>승인 시 글로싸인 전자계약서 발송</li>
              <li>계약 완료 시 파트너 계정 발급 (담당자 이메일로 안내)</li>
              <li>광고주 RFP 도착 시 알림 수신 시작</li>
            </ol>
          </div>
          <div className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/">홈으로</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
