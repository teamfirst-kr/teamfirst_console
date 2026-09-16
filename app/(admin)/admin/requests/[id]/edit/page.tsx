import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import {
  requestDisplayTitle,
  type MatchingBrief,
} from "@/lib/schemas/matching-request";

import { RequestEditForm } from "./edit-form";

export const dynamic = "force-dynamic";

// 접수된 매칭 요청(RFP) 운영자 수정 화면 — 광고주 수정 요청 반영용.
export default async function AdminRequestEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("matching_requests")
    .select("id, title, brief")
    .eq("id", id)
    .single<{ id: string; title: string; brief: MatchingBrief | null }>();

  if (!request) notFound();

  const brief = (request.brief ?? {}) as Partial<MatchingBrief>;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/requests/${id}`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← 요청 상세로
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-secondary">
          요청 수정 — {requestDisplayTitle(request.title, brief)}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          광고주가 요청한 수정사항을 반영하세요. 저장 즉시 광고주 화면·파트너
          RFP·RFP PDF에 모두 적용됩니다. (소진액 증빙 파일은 원본 유지)
        </p>
      </div>

      <RequestEditForm requestId={request.id} brief={brief} />
    </div>
  );
}
