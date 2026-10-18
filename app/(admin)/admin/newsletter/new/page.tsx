import Link from "next/link";

import { createIssue } from "../actions";
import { IssueForm } from "../issue-form";

export const dynamic = "force-dynamic";

export default function NewIssuePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/admin/newsletter" className="text-xs text-muted-foreground hover:underline">
          ← 뉴스레터
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-secondary">새 호 작성</h1>
        <p className="mt-1 text-sm text-muted-foreground">저장하면 초안으로 들어갑니다. 공개를 체크하면 /newsletter 에 노출되고 발송할 수 있습니다.</p>
      </div>
      <IssueForm action={createIssue} submitLabel="저장" />
    </div>
  );
}
