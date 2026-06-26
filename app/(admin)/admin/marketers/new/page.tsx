import Link from "next/link";

import { MarketerForm } from "../marketer-form";
import { createMarketer } from "../actions";

export const metadata = { title: "마케터 등록 | TeamFirst" };

export default function NewMarketerPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/marketers"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← 마케터 관리
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-secondary">마케터 등록</h1>
      </div>
      <MarketerForm action={createMarketer} submitLabel="마케터 등록" />
    </div>
  );
}
