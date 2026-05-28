// ============================================================================
// 기존 계약 완료 대행사 일괄 임포트 (8주차 데이터 마이그레이션)
//
// 사용법:
//   1) .env.local 에 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 설정
//   2) CSV 준비 (헤더 아래 참고)
//   3) node --env-file=.env.local scripts/import-partners.mjs ./partners.csv
//      (계정까지 발급하려면 뒤에 --create-accounts 추가)
//
// CSV 헤더 (1행):
//   company_name, contact_person, contact_email, contact_phone, website,
//   specialty, staff_size, intro, categories
//   - categories 는 세미콜론(;)으로 구분: 예) naver;meta;google
//   - staff_size 예) "6명~20명"
//
// 동작:
//   - partners 를 status='contracted' 로 upsert (contact_email 기준 중복 스킵)
//   - partner_categories 생성
//   - --create-accounts 시 auth 계정 발급 + user_id 연결 (임시 비밀번호 콘솔 출력)
// ============================================================================

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.");
  process.exit(1);
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error("사용법: node --env-file=.env.local scripts/import-partners.mjs <csv경로> [--create-accounts]");
  process.exit(1);
}
const createAccounts = process.argv.includes("--create-accounts");

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- 최소 CSV 파서 (따옴표·콤마·개행 처리) ---
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((v) => v.trim() !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length) {
    row.push(field);
    if (row.some((v) => v.trim() !== "")) rows.push(row);
  }
  return rows;
}

function randomPassword() {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(12))).toString("base64url");
}

const raw = readFileSync(csvPath, "utf-8");
const rows = parseCsv(raw);
const header = rows[0].map((h) => h.trim());
const idx = (name) => header.indexOf(name);

let imported = 0;
let skipped = 0;

for (const r of rows.slice(1)) {
  const get = (name) => {
    const i = idx(name);
    return i >= 0 ? (r[i] ?? "").trim() : "";
  };
  const company_name = get("company_name");
  const contact_email = get("contact_email");
  if (!company_name || !contact_email) {
    console.warn("스킵 (회사명/이메일 누락):", r.join(","));
    skipped++;
    continue;
  }

  // 이메일 중복 확인
  const { data: existing } = await supabase
    .from("partners")
    .select("id")
    .eq("contact_email", contact_email)
    .maybeSingle();
  if (existing) {
    console.log("스킵 (이미 존재):", company_name);
    skipped++;
    continue;
  }

  const { data: inserted, error } = await supabase
    .from("partners")
    .insert({
      company_name,
      contact_person: get("contact_person") || null,
      contact_email,
      contact_phone: get("contact_phone") || null,
      website: get("website") || null,
      specialty: get("specialty") || null,
      staff_size: get("staff_size") || null,
      intro: get("intro") || null,
      status: "contracted",
      contracted_at: new Date().toISOString(),
      reviewed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("실패:", company_name, error.message);
    skipped++;
    continue;
  }

  const cats = get("categories")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  if (cats.length) {
    await supabase
      .from("partner_categories")
      .insert(cats.map((category) => ({ partner_id: inserted.id, category })));
  }

  if (createAccounts) {
    const password = randomPassword();
    const { data: created, error: aerr } = await supabase.auth.admin.createUser({
      email: contact_email,
      password,
      email_confirm: true,
      user_metadata: { role: "partner", name: company_name },
      app_metadata: { role: "partner" },
    });
    if (aerr) {
      console.error("계정 발급 실패:", company_name, aerr.message);
    } else {
      await supabase.from("users").update({ role: "partner", name: company_name }).eq("id", created.user.id);
      await supabase.from("partners").update({ user_id: created.user.id }).eq("id", inserted.id);
      console.log(`계정 발급: ${contact_email}  임시비번: ${password}`);
    }
  }

  console.log("임포트:", company_name);
  imported++;
}

console.log(`\n완료 — 임포트 ${imported}건, 스킵 ${skipped}건`);
