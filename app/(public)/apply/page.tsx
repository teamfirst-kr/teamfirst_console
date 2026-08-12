import { PaybackApplyForm } from "./apply-form";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "페이백 신청 — TeamFirst",
};

export default function PaybackApplyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <h1 className="text-2xl font-bold text-secondary">광고비 페이백 신청</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        사업자등록을 보유한 광고주라면 누구나 신청할 수 있습니다. 접수 후 영업일
        기준 1~2일 내 담당자가 연락드립니다.
      </p>
      <div className="mt-8 rounded-2xl border bg-card p-6 shadow-sm md:p-8">
        <PaybackApplyForm />
      </div>
    </div>
  );
}
