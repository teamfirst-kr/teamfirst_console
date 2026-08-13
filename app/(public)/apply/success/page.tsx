import Link from "next/link";

import { Button } from "@/components/ui/button";

import { PurchaseEvent } from "./lead-event";

export default async function PaybackApplySuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ v?: string }>;
}) {
  const sp = await searchParams;
  const value = Math.max(0, Number(sp.v ?? 0) || 0);
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <PurchaseEvent value={value} />
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
        ✅
      </div>
      <h1 className="mt-6 text-2xl font-bold text-secondary">
        페이백 신청이 접수되었습니다
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        접수 확인 메일을 보내드렸습니다. 담당자가 검토 후 영업일 기준 1~2일 내에
        약정서(전자계약)와 대행권 지정 가이드를 안내드립니다.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">메인으로 돌아가기</Link>
      </Button>
    </div>
  );
}
