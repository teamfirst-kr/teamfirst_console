#!/usr/bin/env node
// 브랜드(광고주) 계정 일괄 발급.
// 초기 비번 = 사업자등록번호(숫자). 첫 로그인 시 변경 강제.
// 사용: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-brands.mjs

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("환경변수 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 필요합니다.");
  process.exit(1);
}

const BRANDS = [
  {
    company_name: "원앤코 주식회사",
    biz_reg_no: "1658102186",
    representative: "김동주",
    contact_person: "허라윤",
    contact_phone: "01045653573",
    brand_name: "라브아",
    website: "https://lavoir.kr/",
    email: "digital1@lavoir.kr",
  },
  {
    company_name: "주식회사지앤원",
    biz_reg_no: "4818602235",
    representative: "박혜경",
    contact_person: "이상현",
    contact_phone: "01026334810",
    brand_name: "보카",
    website: "https://www.bokapetfood.com/",
    email: "gnmone@naver.com",
  },
  {
    company_name: "(주)바래온",
    biz_reg_no: "5458101724",
    representative: "양대훈",
    contact_person: "서호정",
    contact_phone: "01064821263",
    brand_name: "로타입",
    website: "https://www.beidelli.com",
    email: "barely10@naver.com",
  },
];

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let created = 0,
  skipped = 0,
  failed = 0;

for (const b of BRANDS) {
  const bizDigits = b.biz_reg_no.replace(/\D/g, "");
  if (bizDigits.length !== 10) {
    console.error(`사업자번호 형식 오류: ${b.company_name} (${b.biz_reg_no})`);
    failed++;
    continue;
  }

  // 이미 가입된 이메일이면 스킵
  const { data: existingClient } = await supabase
    .from("users")
    .select("id")
    .eq("email", b.email)
    .maybeSingle();
  if (existingClient) {
    console.log("스킵(이미 존재):", b.company_name, b.email);
    skipped++;
    continue;
  }

  const { data: createdUser, error } = await supabase.auth.admin.createUser({
    email: b.email,
    password: bizDigits,
    email_confirm: true,
    user_metadata: {
      role: "client",
      name: b.contact_person,
      company_name: b.company_name,
      biz_reg_no: bizDigits,
    },
    app_metadata: { role: "client", must_change_password: true },
  });
  if (error || !createdUser.user) {
    console.error("계정 발급 실패:", b.company_name, error?.message);
    failed++;
    continue;
  }

  // 트리거가 clients 행을 만들지만 누락 필드 보정
  await supabase
    .from("clients")
    .update({
      company_name: b.company_name,
      biz_reg_no: bizDigits,
      contact_person: b.contact_person,
      contact_phone: b.contact_phone,
      website: b.website,
      notes: `브랜드명: ${b.brand_name} / 대표자: ${b.representative}`,
    })
    .eq("user_id", createdUser.user.id);

  console.log(
    `생성: ${b.company_name} | ${b.email} | 초기 비번: ${bizDigits}`,
  );
  created++;
}

console.log(`\n완료 — 생성 ${created} / 스킵 ${skipped} / 실패 ${failed}`);
