# TeamFirst

광고주와 검증된 광고 대행사를 매칭해주는 양면 플랫폼 — 신규 운영 시스템.

기존 [teamfirst.kr](https://teamfirst.kr) (아임웹)는 마케팅 사이트로 유지하고,
이 저장소는 `app.teamfirst.kr` 서브도메인에서 운영되는 신규 매칭·계약·정산 플랫폼입니다.

---

## 시작하기

### 사전 준비

- Node.js 20+
- pnpm 9+ (npm/yarn도 동작하지만 pnpm 권장)
- Supabase 계정 (Seoul region 프로젝트)
- Resend 계정 (이메일 발송)
- Vercel 계정 (배포)

### 1. 클론 & 설치

```bash
git clone <repo>
cd teamfirst
pnpm install
```

### 2. 환경변수

`.env.example`을 `.env.local`로 복사하고 채웁니다.

```bash
cp .env.example .env.local
```

필요한 키:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (서버 only — 클라이언트에 절대 노출 금지)
- `RESEND_API_KEY`
- `NEXT_PUBLIC_APP_URL` (예: `https://app.teamfirst.kr` 또는 `http://localhost:3000`)

### 3. Supabase 셋업

```bash
# Supabase CLI 설치 (이미 설치된 경우 생략)
npm install -g supabase

# 로컬 Supabase 실행 (선택)
supabase start

# 또는 원격 프로젝트에 직접 마이그레이션 실행
supabase db push
```

또는 Supabase 대시보드 SQL Editor에서 다음 순서로 실행:
1. `db/migrations/001_init.sql`
2. `db/migrations/002_rls.sql`

### 4. 시드 데이터 (선택)

```bash
pnpm seed
```

### 5. 개발 서버

```bash
pnpm dev
```

http://localhost:3000 접속.

---

## 프로젝트 구조

[CLAUDE.md](./CLAUDE.md) 의 "7. 폴더 구조" 절을 참조하세요.

---

## 주요 문서

- [CLAUDE.md](./CLAUDE.md) — Claude Code 작업 시 반드시 먼저 읽을 것
- [docs/ROADMAP.md](./docs/ROADMAP.md) — 8주 MVP 로드맵
- [docs/DECISIONS.md](./docs/DECISIONS.md) — 의사결정 로그
- [docs/FORM_MAPPING.md](./docs/FORM_MAPPING.md) — Tally → 신규 폼 매핑 (작성 예정)
- [db/migrations/](./db/migrations/) — DB 스키마 + RLS 정책

---

## Claude Code 사용 가이드

이 프로젝트는 Claude Code와 짝 프로그래밍 하는 것을 전제로 합니다.

```bash
# 프로젝트 루트에서
claude
```

Claude Code가 자동으로 `CLAUDE.md`를 읽고 컨텍스트를 잡습니다.

### 작업할 때 권장 흐름
1. 매 세션 시작 시 "오늘 무엇을 할지" Claude에게 말하기
2. Claude가 변경 계획을 세우면 검토
3. 코드 변경 후 항상 `pnpm typecheck && pnpm lint` 확인
4. DB 변경은 새 마이그레이션 파일로만 (`db/migrations/003_*.sql`)
5. 의사결정은 `docs/DECISIONS.md`에 추가

---

## 운영 환경

- 본 도메인 (마케팅): https://teamfirst.kr → 아임웹 유지
- 앱 도메인 (운영): https://app.teamfirst.kr → 이 저장소
- DB: Supabase (Seoul)
- 자동화: n8n (별도 호스팅, 기존 유지)
- 전자계약: 글로싸인 (수동, 한도 소진 시 모두싸인 검토)
- 화상미팅: 구글 워크스페이스 / 구글 미트

---

## 라이선스

Private. 무단 사용 금지.
