// ============================================================================
// Tally 대행사 등록신청서(mRA0ld) CSV → partners(contracted) 일괄 임포트
//
// 사용법:
//   node --env-file=.env.local scripts/import-tally-partners.mjs <csv경로> [--create-accounts] [--dry-run]
//
//   - .env.local 에 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요
//   - --create-accounts : 파트너 auth 계정까지 발급(임시비번 콘솔 출력)
//   - --dry-run         : DB 쓰기 없이 파싱 결과만 출력
//
// Tally export 그대로(헤더 다중 줄, 멀티셀렉트 합본 컬럼) 처리한다.
// 매체는 partner_categories, 나머지 선택값은 partners.application(JSONB)에 저장.
// 이메일 기준 중복은 스킵. status=contracted.
// ============================================================================

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const csvPath = process.argv[2];
const createAccounts = process.argv.includes("--create-accounts");
const dryRun = process.argv.includes("--dry-run");
const sqlMode = process.argv.includes("--sql");

if (!csvPath || (!dryRun && !sqlMode && (!url || !key))) {
  console.error("사용법: node --env-file=.env.local scripts/import-tally-partners.mjs <csv> [--create-accounts] [--dry-run]");
  process.exit(1);
}

const MEDIA = [
  ["네이버 SA & GFA", "naver"],
  ["카카오 SA & DA", "kakao"],
  ["Google Ads", "google"],
  ["META Ads", "meta"],
  ["틱톡", "tiktok"],
  ["네트워크 채널", "network"],
  ["언론송출 광고", "press"],
  ["옥외광고", "ooh"],
  ["바이럴마케팅", "viral"],
  ["인플루언서 마케팅", "influencer"],
  ["숏폼 마케팅", "shortform"],
];
const BUDGETS = ["상관없음", "300만원 이상", "500만원 이상", "1,000만원 이상", "3,000만원 이상", "5,000만원 이상"];
const PERIODS = ["상관없음", "3개월 미만 or 프로젝트성", "1년 미만 단기대행", "연간대행", "장기대행"];
const GOALS = ["매출액 증대", "신규 고객 확보", "재구매율 향상", "브랜드 인지도 강화", "앱 설치", "회원가입", "SNS 활성화", "기타"];
const KPIS = ["ROAS or ROI", "CPA", "CTR", "전환수", "앱 설치 수", "SNS 팔로워 증가", "콘텐츠 조회수"];
const REPORTS = ["주간", "월간", "분기", "연간"];
const MEETINGS = ["주간", "월간", "분기", "연간", "별도 요청시 진행"];
const TOOLS = ["GA4", "GTM (구글 태그 매니저)", "CRM 툴", "MMP 툴", "해당없음 또는 기타"];
const PAYMENTS = [
  "1. 공식광고 대행 or 대대행 (무료대행)",
  "2. 월 광고비용의 일정 비율(%) 대행비용 지급",
  "3. 월 관리비 정액제",
  "4. 대행기간 관리비용 선지급 방식",
  "5. 대행사측 광고비 선결제, 이후 광고비용 + 대행비용 지불",
];

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) { row.push(field); if (row.some((v) => v.trim() !== "")) rows.push(row); }
  return rows;
}

const norm = (s) => (s ?? "").replace(/\s+/g, " ").trim();
const rows = parseCsv(readFileSync(csvPath, "utf-8"));
const header = rows[0].map(norm);

// 합본(멀티셀렉트) 컬럼: 질문 문구 포함하되 "(" 옵션 분리 컬럼은 제외
function combinedCol(substr) {
  return header.findIndex((h) => h.includes(substr) && !h.includes("("));
}
function plainCol(substr) {
  return header.findIndex((h) => h.includes(substr));
}
const C = {
  company: plainCol("대행사명 / 사업자명"),
  bizRegNo: plainCol("사업자등록번호"),
  person: plainCol("담당자 성함 / 직책"),
  email: plainCol("이메일주소"),
  phone: plainCol("직통 연락처"),
  website: plainCol("공식 홈페이지 URL"),
  specialty: plainCol("자신있는 업종/카테고리"),
  staff: combinedCol("현재 직원수를 알려주세요"),
  intro: plainCol("어필하고 싶은"),
  media: combinedCol("광고대행이 가능한 매체"),
  budget: combinedCol("광고주 예산을 선택"),
  period: combinedCol("계약기간을 선택"),
  performance: combinedCol("성과형 보수"),
  goals: combinedCol("개선에 자신있는 마케팅 목표"),
  kpis: combinedCol("중요하게 보는 성과지표"),
  reports: combinedCol("리포트 주기를 선택"),
  meetings: combinedCol("미팅을 희망하는 주기"),
  tools: combinedCol("운영이 가능한 툴"),
  preferred: plainCol("매칭을 희망하는 광고주의 특징"),
  avoided: plainCol("매칭을 희망하지 않는 광고주의 특징"),
  payment: combinedCol("희망 계약 방식"),
  fee: plainCol("수수료가 발생하는 것에 동의"),
};

const cell = (row, i) => (i >= 0 ? (row[i] ?? "").trim() : "");

// 질문 키워드의 합본(첫) 컬럼. Tally export는 [합본, 옵션1, 옵션2...] 순서이며
// per-option 불리언이 합본과 불일치하는 경우가 있어 합본 텍스트를 신뢰원으로 쓴다.
function combinedText(row, keyword) {
  const cs = header.map((h, i) => [h, i]).filter(([h]) => h.includes(keyword)).map(([, i]) => i);
  return cs.length ? cell(row, cs[0]) : "";
}
function multi(row, keyword, labels) {
  const text = combinedText(row, keyword);
  return labels.filter((l) => text.includes(l));
}

const records = rows.slice(1).map((row) => {
  const mediaText = combinedText(row, "광고대행이 가능한 매체");
  const mediaValues = MEDIA.filter(([l]) => mediaText.includes(l)).map(([, v]) => v);
  return {
    company_name: cell(row, C.company).split("/")[0].trim(),
    biz_reg_no: cell(row, C.bizRegNo).replace(/\D/g, "") || null,
    contact_person: cell(row, C.person) || null,
    contact_email: cell(row, C.email),
    contact_phone: cell(row, C.phone) || null,
    website: cell(row, C.website) || null,
    specialty: cell(row, C.specialty) || null,
    staff_size: cell(row, C.staff) || null,
    intro: cell(row, C.intro) || null,
    categories: mediaValues,
    application: {
      budget_ranges: multi(row, "광고주 예산을 선택", BUDGETS),
      contract_periods: multi(row, "계약기간을 선택", PERIODS),
      performance_based: combinedText(row, "성과형 보수").includes("예"),
      marketing_goals: multi(row, "개선에 자신있는 마케팅 목표", GOALS),
      kpis: multi(row, "중요하게 보는 성과지표", KPIS),
      report_cycles: multi(row, "리포트 주기를 선택", REPORTS),
      meeting_cycles: multi(row, "미팅을 희망하는 주기", MEETINGS),
      tools: multi(row, "운영이 가능한 툴", TOOLS),
      preferred_client_traits: cell(row, C.preferred) || null,
      avoided_client_traits: cell(row, C.avoided) || null,
      payment_methods: multi(row, "희망 계약 방식", PAYMENTS),
      fee_agreement: cell(row, C.fee).includes("네") || cell(row, C.fee).includes("넵"),
    },
  };
}).filter((r) => r.company_name && r.contact_email);

if (dryRun) {
  console.log(JSON.stringify(records, null, 2));
  console.log(`\n총 ${records.length}건 파싱됨 (dry-run, DB 미반영)`);
  process.exit(0);
}

if (sqlMode) {
  const q = (v) => (v == null ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);
  const arr = (a) => `ARRAY[${a.map((v) => `'${String(v).replace(/'/g, "''")}'`).join(",")}]::text[]`;
  const out = [
    "-- 글로싸인 계약 완료 대행사 일괄 임포트 (status=contracted)",
    "-- 이메일 중복 시 건너뜀. 계정(로그인) 발급은 운영자 화면 또는 --create-accounts 스크립트로.",
    "",
  ];
  for (const r of records) {
    const a = r.application;
    out.push(`WITH new_partner AS (
  INSERT INTO public.partners
    (company_name, biz_reg_no, contact_person, contact_email, contact_phone, website, specialty, staff_size, intro, application, status, applied_at, reviewed_at, contracted_at)
  SELECT ${q(r.company_name)}, ${q(r.biz_reg_no)}, ${q(r.contact_person)}, ${q(r.contact_email)}, ${q(r.contact_phone)}, ${q(r.website)}, ${q(r.specialty)}, ${q(r.staff_size)}, ${q(r.intro)}, ${q(JSON.stringify(a))}::jsonb, 'contracted', NOW(), NOW(), NOW()
  WHERE NOT EXISTS (SELECT 1 FROM public.partners WHERE contact_email = ${q(r.contact_email)})
  RETURNING id
)
INSERT INTO public.partner_categories (partner_id, category)
SELECT id, unnest(${arr(r.categories)}) FROM new_partner;`);
    out.push("");
  }
  console.log(out.join("\n"));
  process.exit(0);
}

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const randomPw = () => Buffer.from(crypto.getRandomValues(new Uint8Array(12))).toString("base64url");

let imported = 0, skipped = 0;
for (const rec of records) {
  const { data: existing } = await supabase
    .from("partners").select("id").eq("contact_email", rec.contact_email).maybeSingle();
  if (existing) { console.log("스킵(이미 존재):", rec.company_name); skipped++; continue; }

  const { categories, application, ...partner } = rec;
  const { data: inserted, error } = await supabase
    .from("partners")
    .insert({ ...partner, application, status: "contracted", contracted_at: new Date().toISOString(), reviewed_at: new Date().toISOString() })
    .select("id").single();
  if (error) { console.error("실패:", rec.company_name, error.message); skipped++; continue; }

  if (categories.length) {
    await supabase.from("partner_categories").insert(categories.map((category) => ({ partner_id: inserted.id, category })));
  }

  if (createAccounts) {
    // 임시 비밀번호는 항상 난수로 발급 (특정 값을 비밀번호로 쓰지 않음). 첫 로그인 시 변경 강제.
    const password = randomPw();
    const { data: created, error: aerr } = await supabase.auth.admin.createUser({
      email: rec.contact_email, password, email_confirm: true,
      user_metadata: { role: "partner", name: rec.company_name }, app_metadata: { role: "partner", must_change_password: true },
    });
    if (aerr) console.error("계정 발급 실패:", rec.company_name, aerr.message);
    else {
      await supabase.from("users").update({ role: "partner", name: rec.company_name }).eq("id", created.user.id);
      await supabase.from("partners").update({ user_id: created.user.id }).eq("id", inserted.id);
      console.log(`계정: ${rec.contact_email}  임시비번: ${password}`);
    }
  }
  console.log("임포트:", rec.company_name);
  imported++;
}
console.log(`\n완료 — 임포트 ${imported}건, 스킵 ${skipped}건`);
