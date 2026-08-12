"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Papa from "papaparse";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  pbBulkConfirm,
  pbCancelSettlement,
  pbCreatePayout,
  pbGenerateDrafts,
  pbImportSpendRows,
  pbSetInvoiceIssued,
  pbSetReconciled,
  pbUpdateSpend,
  type PbSettleResult,
} from "./actions";

export type GridRow = {
  id: string;
  clientName: string;
  invoiceCapable: boolean;
  consultingWarn: boolean; // 2개월 연속 미달 경고
  period: string;
  statementNo: string | null;
  adSpendTotal: number;
  tierLabel: string | null;
  baseRate: number | null;
  modifierTotal: number | null;
  appliedRate: number | null;
  supply: number;
  vat: number;
  total: number;
  status: string;
  invoiceStatus: string;
  invoiceDue: string | null;
  reconciled: boolean;
  disputeFlag: boolean;
};

const STATUS_LABEL: Record<string, string> = {
  draft: "작성 중",
  confirmed: "확정",
  paid: "지급 완료",
  canceled: "취소",
};
const INVOICE_LABEL: Record<string, string> = {
  not_required: "불필요",
  pending: "발행 대기",
  issued: "발행 확인",
  overdue: "기한 경과(보류)",
};

function payable(r: GridRow): boolean {
  return (
    r.status === "confirmed" &&
    r.reconciled &&
    ["issued", "not_required"].includes(r.invoiceStatus)
  );
}

function fmt(n: number): string {
  return n.toLocaleString("ko-KR");
}

export function SettlementGrid({
  period,
  rows,
}: {
  period: string;
  rows: GridRow[];
}) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<PbSettleResult | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [payoutMemo, setPayoutMemo] = useState("");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (filter === "all") return rows.filter((r) => r.status !== "canceled");
    if (filter === "hold") return rows.filter((r) => r.invoiceStatus === "overdue");
    if (filter === "payable") return rows.filter(payable);
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);

  const totals = useMemo(() => {
    const live = rows.filter((r) => r.status !== "canceled");
    return {
      spend: live.reduce((s, r) => s + r.adSpendTotal, 0),
      supply: live.reduce((s, r) => s + r.supply, 0),
      vat: live.reduce((s, r) => s + r.vat, 0),
      payable: live.filter(payable).reduce((s, r) => s + r.total, 0),
    };
  }, [rows]);

  function run(fn: () => Promise<PbSettleResult>) {
    setResult(null);
    start(async () => setResult(await fn()));
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onCsv(file: File) {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const parsed = res.data
          .map((r) => ({
            business_number: String(r.business_number ?? r["사업자번호"] ?? ""),
            media: String(r.media ?? r["매체"] ?? ""),
            product: String(r.product ?? r["상품"] ?? ""),
            amount: Number(String(r.amount ?? r["금액"] ?? "").replace(/[^\d.-]/g, "")),
          }))
          .filter((r) => r.business_number && Number.isFinite(r.amount));
        if (parsed.length === 0) {
          setResult({ ok: false, error: "CSV에서 유효한 행을 찾지 못했습니다. (헤더: business_number, media, product, amount)" });
          return;
        }
        if (!confirm(`${parsed.length}행을 ${period} 정산에 반영할까요? (사업자번호별 합산, draft만)`)) return;
        run(() => pbImportSpendRows(period, parsed));
      },
      error: () => setResult({ ok: false, error: "CSV 파싱 실패" }),
    });
  }

  const draftCount = rows.filter((r) => r.status === "draft").length;

  return (
    <div className="space-y-4">
      {/* 상단 액션 바 */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => pbGenerateDrafts(period))}
        >
          ① 대상 생성 (active 전원)
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onCsv(f);
            e.target.value = "";
          }}
        />
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => fileRef.current?.click()}
        >
          ② CSV 업로드
        </Button>
        <Button
          size="sm"
          disabled={pending || draftCount === 0}
          onClick={() => {
            if (confirm(`${period} draft ${draftCount}건을 일괄 확정하고 정산서 메일을 발송할까요? 확정 후에는 수정할 수 없습니다(취소+재생성만 가능).`)) {
              run(() => pbBulkConfirm(period));
            }
          }}
        >
          ③ 일괄 확정 + 정산서 발송
        </Button>
        <div className="ml-auto flex items-center gap-1.5">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-2 text-xs"
          >
            <option value="all">전체</option>
            <option value="draft">작성 중</option>
            <option value="confirmed">확정</option>
            <option value="payable">지급 가능만</option>
            <option value="hold">보류만</option>
            <option value="paid">지급 완료</option>
          </select>
        </div>
      </div>

      {result ? (
        <div
          className={
            result.ok
              ? "rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
              : "rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
          }
        >
          {result.ok ? (result.message ?? "처리 완료") : result.error}
        </div>
      ) : null}

      {/* 그리드 */}
      <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-3 font-medium">
                <span className="sr-only">선택</span>
              </th>
              <th className="px-3 py-3 font-medium">고객사</th>
              <th className="px-3 py-3 text-right font-medium">광고비(VAT 제외)</th>
              <th className="px-3 py-3 font-medium">구간/요율</th>
              <th className="px-3 py-3 text-right font-medium">공급가액</th>
              <th className="px-3 py-3 text-right font-medium">VAT</th>
              <th className="px-3 py-3 text-right font-medium">합계</th>
              <th className="px-3 py-3 font-medium">상태</th>
              <th className="px-3 py-3 font-medium">계산서</th>
              <th className="px-3 py-3 font-medium">대사</th>
              <th className="px-3 py-3 font-medium">지급</th>
              <th className="px-3 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-3 py-10 text-center text-xs text-muted-foreground">
                  표시할 정산이 없습니다. ① 대상 생성부터 시작하세요.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="px-3 py-2.5">
                    {payable(r) ? (
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        className="h-4 w-4"
                        aria-label={`${r.clientName} 지급 선택`}
                      />
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-medium text-foreground">{r.clientName}</div>
                    <div className="flex gap-1 text-[11px] text-muted-foreground">
                      {r.statementNo ?? "—"}
                      {!r.invoiceCapable ? <Badge variant="muted">간이·면세</Badge> : null}
                      {r.disputeFlag ? <Badge variant="destructive">이의신청</Badge> : null}
                    </div>
                    {r.consultingWarn ? (
                      <div className="mt-0.5 text-[11px] text-amber-600">
                        ⚠️ 컨설팅 2개월 연속 미달 — 익월 자동 해제 예약됨
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {r.status === "draft" ? (
                      <SpendInput
                        id={r.id}
                        value={r.adSpendTotal}
                        disabled={pending}
                        onSave={(v) => run(() => pbUpdateSpend(r.id, v))}
                      />
                    ) : (
                      <span>{fmt(r.adSpendTotal)}원</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    {r.tierLabel ? (
                      <>
                        {r.tierLabel}
                        <div>
                          {r.baseRate}%
                          {r.modifierTotal ? ` − ${r.modifierTotal}%p` : ""} ={" "}
                          <strong className="text-foreground">{r.appliedRate}%</strong>
                        </div>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">{fmt(r.supply)}</td>
                  <td className="px-3 py-2.5 text-right">{fmt(r.vat)}</td>
                  <td className="px-3 py-2.5 text-right font-semibold">{fmt(r.total)}</td>
                  <td className="px-3 py-2.5">
                    <Badge variant={r.status === "paid" ? "default" : "muted"}>
                      {STATUS_LABEL[r.status] ?? r.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    {r.status === "draft" ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : ["pending", "overdue"].includes(r.invoiceStatus) ? (
                      <button
                        disabled={pending}
                        onClick={() => {
                          const d = prompt("계산서 발행일 (YYYY-MM-DD)", new Date().toISOString().slice(0, 10));
                          if (d) run(() => pbSetInvoiceIssued(r.id, d));
                        }}
                        className={
                          "rounded-md border px-2 py-1 text-xs transition-colors hover:bg-accent " +
                          (r.invoiceStatus === "overdue"
                            ? "border-amber-300 bg-amber-50 text-amber-700"
                            : "border-input")
                        }
                      >
                        {INVOICE_LABEL[r.invoiceStatus]} → 발행 확인
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {INVOICE_LABEL[r.invoiceStatus]}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {r.status === "confirmed" ? (
                      <input
                        type="checkbox"
                        checked={r.reconciled}
                        disabled={pending}
                        onChange={(e) => run(() => pbSetReconciled(r.id, e.target.checked))}
                        className="h-4 w-4"
                        aria-label="매체 입금 대사"
                      />
                    ) : r.reconciled ? (
                      "✓"
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {r.status === "paid" ? (
                      <Badge variant="default">완료</Badge>
                    ) : payable(r) ? (
                      <Badge className="bg-emerald-600">지급 가능</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">대기</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {["draft", "confirmed"].includes(r.status) ? (
                      <button
                        disabled={pending}
                        onClick={() => {
                          setCancelId(cancelId === r.id ? null : r.id);
                          setCancelReason("");
                        }}
                        className="text-xs text-muted-foreground hover:text-destructive"
                      >
                        취소
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {/* 합계 푸터 */}
          <tfoot className="border-t bg-muted/40 text-sm font-medium">
            <tr>
              <td colSpan={2} className="px-3 py-3">
                합계 (취소 제외)
              </td>
              <td className="px-3 py-3 text-right">{fmt(totals.spend)}원</td>
              <td />
              <td className="px-3 py-3 text-right">{fmt(totals.supply)}</td>
              <td className="px-3 py-3 text-right">{fmt(totals.vat)}</td>
              <td className="px-3 py-3 text-right font-bold">
                {fmt(totals.supply + totals.vat)}
              </td>
              <td colSpan={4} className="px-3 py-3 text-right text-xs text-muted-foreground">
                지급 예정액(payable): <strong className="text-foreground">{fmt(totals.payable)}원</strong>
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 취소 사유 입력 */}
      {cancelId ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <span className="text-xs font-medium text-destructive">취소 사유 (필수):</span>
          <Input
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="h-9 flex-1 text-xs"
            placeholder="예: 광고비 오입력 — 재생성 예정"
          />
          <Button
            size="sm"
            variant="outline"
            disabled={pending || !cancelReason.trim()}
            onClick={() => {
              run(() => pbCancelSettlement(cancelId, cancelReason));
              setCancelId(null);
            }}
          >
            취소 확정
          </Button>
        </div>
      ) : null}

      {/* 지급 처리 바 */}
      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
          <span className="text-sm font-medium text-emerald-800">
            {selected.size}건 선택 · 합계{" "}
            {fmt(
              rows
                .filter((r) => selected.has(r.id))
                .reduce((s, r) => s + r.total, 0),
            )}
            원
          </span>
          <Input
            value={payoutMemo}
            onChange={(e) => setPayoutMemo(e.target.value)}
            placeholder="배치 메모 (선택)"
            className="h-9 w-56 text-xs"
          />
          <Button
            size="sm"
            disabled={pending}
            onClick={() => {
              if (confirm(`${selected.size}건을 지급 처리할까요? 실제 이체는 은행에서 별도 실행하세요 — 플랫폼은 기록만 남깁니다.`)) {
                run(() => pbCreatePayout([...selected], payoutMemo));
                setSelected(new Set());
              }
            }}
          >
            💸 지급 처리 (기록)
          </Button>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        CSV 헤더: <code>business_number, media, product, amount</code> — 사업자번호별로
        합산되어 draft 행에 반영됩니다. 실제 이체는 플랫폼 밖(은행)에서 실행하며, 이
        화면은 산정·증빙·상태 기록만 담당합니다.
      </p>
    </div>
  );
}

function SpendInput({
  id,
  value,
  disabled,
  onSave,
}: {
  id: string;
  value: number;
  disabled: boolean;
  onSave: (v: number) => void;
}) {
  const [draft, setDraft] = useState(value ? value.toLocaleString("ko-KR") : "");
  const parsed = Number(draft.replace(/\D/g, "")) || 0;
  const dirty = parsed !== value;
  return (
    <span className="inline-flex items-center gap-1">
      <input
        id={`spend-${id}`}
        inputMode="numeric"
        value={draft}
        disabled={disabled}
        onChange={(e) => {
          const n = e.target.value.replace(/\D/g, "");
          setDraft(n ? Number(n).toLocaleString("ko-KR") : "");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && dirty) onSave(parsed);
        }}
        className="h-8 w-32 rounded-md border border-input bg-background px-2 text-right text-sm"
        placeholder="0"
      />
      {dirty ? (
        <button
          disabled={disabled}
          onClick={() => onSave(parsed)}
          className="rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground"
        >
          저장
        </button>
      ) : null}
    </span>
  );
}
