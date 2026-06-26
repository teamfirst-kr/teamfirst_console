import Link from "next/link";

import { CaseForm } from "../case-form";
import { createCase } from "../actions";

export const metadata = { title: "사례 작성 | TeamFirst" };

export default function NewCasePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/cases"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← 사례 관리
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-secondary">사례 작성</h1>
      </div>
      <CaseForm action={createCase} submitLabel="사례 저장" />
    </div>
  );
}
