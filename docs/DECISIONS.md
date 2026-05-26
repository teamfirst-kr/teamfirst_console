# 의사결정 로그 (Decisions Log)

> 모든 비자명한 결정은 여기에 누적 기록합니다. 형식: 날짜 — 결정 — 이유.

---

## 2026-05-26 — 프로젝트 1주차 셋업
- **Next.js 15.5 + App Router + TypeScript strict** 채택. CLAUDE.md 6번 표 준수.
- **루트 `app/` 사용** (src/ 미사용). `tsconfig.json`의 `@/*` 경로가 루트 기준.
- **Tailwind v4** 기본값 + `app/globals.css`에 디자인 토큰(HSL) 정의. navy 계열 primary(`#004AAD`)·secondary(`#111E38`).
- **Pretendard Variable** 폰트는 jsDelivr CDN으로 로드 — `next/font/google`는 한글 Pretendard 미지원.
- **shadcn/ui CLI가 인터랙티브 강제**여서 `components.json` + `lib/utils.ts`를 수동 작성. 이후 컴포넌트는 `shadcn add` 시도 가능 여부 재확인.
- **Supabase 클라이언트 3종 분리**: `lib/supabase/{client,server,admin}.ts`. admin은 `import "server-only"`로 클라이언트 번들 차단.
- **세션 갱신은 middleware**(`@supabase/ssr` 패턴). 모든 라우트에 대해 `auth.getUser()` 호출로 쿠키 회전.
- **`types/database.ts`는 자리표시자**. 추후 `supabase gen types typescript` 출력으로 덮어쓸 것.

## 2026-05-26 — DB 스키마 v1
- `db/migrations/001_init.sql` + `002_rls.sql` 적용 결정. 11개 테이블 + ENUM + 인덱스 + RLS 정책.
- **헬퍼 함수 `is_admin()`/`current_client_id()`/`current_partner_id()`** 를 `SECURITY DEFINER STABLE`로 정의 — RLS 정책 내부 서브쿼리 N+1 방지.
- **`partners.user_id`는 NULL 허용** — 등록 신청 시점에는 계정 미발급. 계약 완료 후 채움.
- **익명 insert 허용 테이블은 `partners` + `partner_categories`** (등록 신청서). 그 외 모두 차단.
- 후보 `rank`는 1~3으로 CHECK 제약, MVP `MAX_CANDIDATES = 3` 고정.
