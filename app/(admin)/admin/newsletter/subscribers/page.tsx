import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateText } from "@/components/date-text";
import { createClient } from "@/lib/supabase/server";
import { ORG_TYPE_LABEL } from "@/lib/newsletter/constants";
import { normalizeBizRegNo } from "@/lib/schemas/matching-request";
import type { NewsletterSubscriberRow } from "@/types/database";

import { SubscriberActions } from "./subscriber-actions";

export const dynamic = "force-dynamic";

type Row = Pick<NewsletterSubscriberRow, "id" | "email" | "brand_name" | "biz_reg_no" | "name" | "org_type" | "source" | "status" | "created_at">;

export default async function SubscribersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status, q } = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("newsletter_subscribers")
    .select("id, email, brand_name, biz_reg_no, name, org_type, source, status, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (status === "subscribed" || status === "unsubscribed") query = query.eq("status", status);
  // 검색어는 PostgREST 필터 문법·LIKE 와일드카드를 제거한 안전 문자만 사용, 사업자번호 조건은 숫자가 있을 때만
  const safe = (q ?? "").replace(/[^\p{L}\p{N}@.\- ]/gu, "").trim().slice(0, 60);
  const digits = (q ?? "").replace(/\D/g, "").slice(0, 10);
  const clauses = safe ? [`email.ilike."%${safe}%"`, `brand_name.ilike."%${safe}%"`] : [];
  if (digits) clauses.push(`biz_reg_no.ilike."%${digits}%"`);
  if (clauses.length > 0) query = query.or(clauses.join(","));
  const { data, error } = await query;
  const rows = (error ? [] : (data ?? [])) as Row[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/admin/newsletter" className="text-xs text-muted-foreground hover:underline">
            ← 뉴스레터
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-secondary">구독자 관리</h1>
          <p className="mt-1 text-sm text-muted-foreground">뉴스레터 열람·수신을 위해 등록한 브랜드사·대행사 DB입니다. (최근 500명)</p>
        </div>
        <Button asChild variant="outline">
          <a href={`/admin/newsletter/subscribers/export${status ? `?status=${status}` : ""}`}>CSV 다운로드</a>
        </Button>
      </div>

      <form className="flex flex-wrap items-center gap-2 text-sm" action="/admin/newsletter/subscribers">
        <input type="search" name="q" defaultValue={q ?? ""} placeholder="이메일 · 브랜드명 · 사업자번호 검색" className="h-9 w-72 rounded-md border bg-background px-3 text-sm" />
        <select name="status" defaultValue={status ?? ""} className="h-9 rounded-md border bg-background px-2 text-sm">
          <option value="">전체</option>
          <option value="subscribed">구독 중</option>
          <option value="unsubscribed">수신거부</option>
        </select>
        <Button type="submit" size="sm" variant="outline">
          검색
        </Button>
      </form>

      {error ? <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">구독자 테이블을 조회하지 못했습니다. 마이그레이션 032를 적용했는지 확인하세요. ({error.message})</p> : null}

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">등록된 구독자가 없습니다.</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">브랜드 / 사업자번호</th>
                <th className="px-4 py-2.5 font-medium">이메일 / 담당자</th>
                <th className="px-4 py-2.5 font-medium">유형</th>
                <th className="px-4 py-2.5 font-medium">유입</th>
                <th className="px-4 py-2.5 font-medium">상태</th>
                <th className="px-4 py-2.5 font-medium">등록</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.id} className={r.status === "unsubscribed" ? "text-muted-foreground" : undefined}>
                  <td className="px-4 py-2.5">
                    <p className="font-semibold text-foreground">{r.brand_name}</p>
                    <p className="text-xs text-muted-foreground">{normalizeBizRegNo(r.biz_reg_no)}</p>
                  </td>
                  <td className="px-4 py-2.5">
                    <a href={`mailto:${r.email}`} className="text-primary hover:underline">
                      {r.email}
                    </a>
                    {r.name ? <p className="text-xs text-muted-foreground">{r.name}</p> : null}
                  </td>
                  <td className="px-4 py-2.5 text-xs">{ORG_TYPE_LABEL[r.org_type] ?? r.org_type}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{r.source ?? "-"}</td>
                  <td className="px-4 py-2.5">{r.status === "subscribed" ? <Badge variant="success">구독 중</Badge> : <Badge variant="muted">수신거부</Badge>}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    <DateText value={r.created_at} />
                  </td>
                  <td className="px-4 py-2.5">
                    <SubscriberActions id={r.id} status={r.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
