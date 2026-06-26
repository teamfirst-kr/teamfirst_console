import { MarketerRequestForm } from "./marketer-request-form";

export const metadata = { title: "마케터 매칭 신청 | TeamFirst" };

export default function MarketerApplyPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="text-center">
        <span className="text-xs font-bold tracking-widest text-primary">
          MARKETER MATCHING
        </span>
        <h1 className="mt-3 text-3xl font-bold text-secondary">
          마케터 매칭 신청
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          필요한 분야와 목표를 알려주시면, 검증된 마케터를 제안해드립니다. 채용
          전까지 매칭은 무료입니다.
        </p>
      </div>
      <div className="mt-8">
        <MarketerRequestForm />
      </div>
    </div>
  );
}
