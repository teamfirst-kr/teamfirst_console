# TeamFirst (팀퍼스트) — Project Brief for Claude Code

> 이 문서는 Claude Code가 이 프로젝트에서 작업할 때 **항상 먼저 읽어야 하는** 설계서입니다.
> 어떤 작업을 하든 이 문서의 결정사항을 위반하지 마세요. 모호한 부분이 있으면 사용자(정기윤 과장)에게 질문하세요.

> **📌 제품 기준 문서:** 전체 제품 범위·로드맵·페이지 명세는 [`docs/PRD.md`](docs/PRD.md)가 단일 기준(SSOT)입니다.
> 미확정 사항은 [`docs/OPEN_QUESTIONS.md`](docs/OPEN_QUESTIONS.md)에 기록합니다.
> **구현 정책(Option ① 확정, 2026-06-26):** 기존 Supabase 스택 + `(client)/(partner)/(admin)` 라우트를
> 유지하고, PRD에만 있는 가치 항목(디자인 토큰 네이비 통일 → 멀티스텝 신청 폼 → RFP PDF 엔진 →
> 운영자 KPI 대시보드 → 마케터 매칭)을 a→e 순서로 점진 추가합니다. PRD §8(Prisma)·§5(라우트 재명명)는
> 목표 참조용이며 현 구현과 1:1 일치하지 않습니다. 디자인 primary는 **네이비 `#111E38`** 로 통일합니다.

---

## 1. 프로젝트 정체성

**TeamFirst (팀퍼스트)** 는 광고주(브랜드사)와 검증된 광고 대행사를 매칭해주는 양면 플랫폼입니다.
단순 중개가 아니라, **입점 기준을 통과한 파트너만** 노출시키고, 매칭부터 미팅·계약·정산까지 한 사이트에서 처리하는 것이 목표입니다.

### 현재 상태 (As-Is)
- 아임웹(Imweb)으로 마케팅 사이트 운영 중
- 매칭 요청 / 지원서 / 등록 신청서는 **Tally 폼**으로 수집
- RFP 자동 발송은 **n8n + 구글 슬라이드**
- 계약은 **글로싸인** 전자계약
- 매칭·미팅·이력 관리는 **이메일과 수기**로 처리 → 이게 가장 큰 페인포인트

### 목표 (To-Be)
- 아임웹은 **마케팅용으로 유지**
- 서브도메인 `app.teamfirst.kr`에 **신규 운영 플랫폼** 구축
- 매칭 요청 → 매칭 → 선정 → 미팅 → 계약 → 정산이 **한 사이트 내에서 완결**
- 모든 이력이 **타임라인 형태**로 보관되어 메일함을 뒤지지 않아도 됨

---

## 2. 사용자 역할

| 역할 | 영문 키 | 누가 | 인증 방식 |
|---|---|---|---|
| 광고주 | `client` | 브랜드사 담당자 | 이메일 + 카카오 SSO |
| 파트너 | `partner` | 입점 완료 대행사 | 이메일 (운영자 발급) |
| 운영자 | `admin` | 팀퍼스트 직원 | 이메일 + 2FA |
| 마케터 | `marketer` | 프리랜서 | **Phase 2에서 도입** — MVP 미포함 |

> **MVP는 3개 역할만** 다룹니다. 마케터 양면 플랫폼은 Phase 2로 미뤘습니다.

---

## 3. 비즈니스 모델 (수수료 구조)

이 부분은 **시스템 설계에 직접 영향을 미치므로** 명확히 이해해야 합니다.

### 3.1 대행수수료 발생 방식

| 매체 유형 | 매체 예시 | 수수료 발생 | 대행사 수익 |
|---|---|---|---|
| **공식대행 매체** | 네이버, 카카오 | 매체사가 환급 | 광고비 소진액의 15% |
| **비공식대행 매체** | 구글, 메타, 틱톡 | 대행사가 광고주에 마크업 청구 | 광고비 소진액의 10–15% (운영 난이도 기준) |

### 3.2 팀퍼스트 정산
- 대행이 성사되면 **위 대행수수료의 일부**를 팀퍼스트가 받음
- 정확한 분할 비율은 계약별로 다를 수 있음 (DB에 `deals.fee_rate`로 저장)
- 매월 후불 정산

### 3.3 1% 프로모션
- 2026년 6월부로 종료 → **시스템에서 제외**, 코드에 흔적 남기지 말 것

---

## 4. 라이프사이클 (5단계)

```
[1. 파트너 온보딩]
  대행사 등록신청서 (Tally 대체) → 운영자 검토 → 글로싸인 계약 → 입점완료

[2. 매칭]
  매칭 요청서 (Tally 대체) → RFP 자동발송(계약완료 전원) → 대행사 지원서 → 상위 3개사 선정

[3. 제안·미팅]
  광고주 후보 확인 → 분석권한 부여(지난 3개월 광고비 업로드) → 일정 조율 → 화상미팅(2-3일전 구글미트 링크)

[4. 계약·이관]
  대행 결정(미팅 후 7일 데드라인) → 대행계약서 → 매체 이관 → 운영 시작

[5. 정산] — Phase 2에서 본격 구현
  월 소진액 발생 → 대행수수료 산정 → 팀퍼스트 정산
```

### 4.1 라이프사이클의 핵심 규칙
- **RFP 발송 범위**: 계약완료 대행사 **전원**에게 발송 (카테고리 필터링 없음 — 사용자 결정)
- **상위 3개사 선정**: 운영자 큐레이션. 자동 점수화 없음 (Phase 2 검토)
- **분석권한과 관리권한은 다름**:
  - 분석권한: 미팅 전, 광고주 동의로 임시 부여 (지난 3개월 광고비 분석용)
  - 관리권한: 본격 계약 후 매체사로부터 공식 인정받는 이관 절차
- **미팅 후 7일 데드라인**: 대행 여부 결정. 5일째 양쪽에 자동 리마인드

---

## 5. 3가지 핵심 폼 (Tally 대체)

기존 Tally 폼을 신규 시스템 폼으로 옮깁니다. 폼 ID는 절대 같은 의미로 사용하지 마세요 — 분리되어 있습니다.

| Tally 폼 | 신규 시스템 위치 | DB 테이블 | 사용자 |
|---|---|---|---|
| 대행사 등록신청서 ([mRA0ld](https://tally.so/r/mRA0ld)) | `/partner/apply` (공개) | `partners` (status=pending) + `partner_categories` | 입점 희망 대행사 |
| 매칭 요청서 ([3yBY1W](https://tally.so/r/3yBY1W)) | `/client/request/new` (로그인) | `matching_requests` | 광고주 |
| 광고대행 지원서 ([lbBZNB](https://tally.so/r/lbBZNB)) | `/partner/rfp/{id}/apply` (로그인) | `applications` | 입점 대행사 |

> **주의**: 등록신청서와 RFP 지원서는 **다른 폼**입니다. 한 폼으로 합치지 마세요.

> **필드 매핑 디테일은 별도 문서로 작성 예정.** Tally 폼 실제 필드를 1:1 대응시켜야 함.

---

## 6. 기술 스택

| 영역 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | Next.js 15 (App Router) + TypeScript | strict mode 필수 |
| UI | Tailwind CSS + shadcn/ui | 아임웹과 톤 맞추기 (Pretendard Variable 폰트) |
| DB | Supabase (Postgres) | RLS 필수 |
| 인증 | Supabase Auth | 이메일 + 카카오 OAuth |
| 파일 저장 | Supabase Storage | 광고비 증빙, 포트폴리오 PDF |
| 실시간 | Supabase Realtime | 새 지원서·상태 변경 알림 |
| 이메일 | Resend | 트랜잭션 메일 |
| 자동화 | n8n (기존 유지) + Supabase Webhook | DB 이벤트 → n8n 트리거 |
| 전자계약 | 글로싸인 (당분간 수동 발송) | 한도 소진 시 모두싸인 재검토 |
| 화상미팅 | 구글 미트 (당분간 수동 링크) | Google Meet API 추후 검토 |
| 배포 | Vercel | 서브도메인 `app.teamfirst.kr` |
| 모니터링 | Vercel Analytics + Sentry | 에러 추적 |

### 6.1 절대 사용 금지
- `localStorage` / `sessionStorage` 의존 (Supabase 세션은 cookie 기반으로 통일)
- 가짜 localStorage 모킹
- ORM 추가 도입 (Prisma 등 — Supabase 클라이언트 SDK로 충분)
- 클라이언트에서 직접 service_role 키 사용 (절대)

### 6.2 권장 라이브러리
- 폼: `react-hook-form` + `zod`
- 날짜: `date-fns` (한국 로케일)
- 표: `@tanstack/react-table`
- 차트: `recharts`
- 아이콘: `lucide-react`

---

## 7. 폴더 구조

```
teamfirst/
├── CLAUDE.md                 ← 이 파일
├── README.md                 ← 셋업 가이드
├── docs/
│   ├── ROADMAP.md            ← 8주 MVP 일정
│   ├── DB_SCHEMA.md          ← DB 상세 설명
│   ├── FORM_MAPPING.md       ← Tally → 신규 폼 매핑 (작성 예정)
│   └── DECISIONS.md          ← 의사결정 로그
├── db/
│   └── migrations/
│       ├── 001_init.sql      ← 초기 스키마
│       └── 002_rls.sql       ← RLS 정책
├── supabase/                 ← Supabase CLI 설정
├── app/                      ← Next.js App Router
│   ├── (public)/             ← 비로그인 가능
│   │   ├── page.tsx
│   │   └── partner/apply/
│   ├── (client)/             ← 광고주 전용
│   │   ├── layout.tsx        ← 광고주 권한 가드
│   │   ├── dashboard/
│   │   ├── request/new/
│   │   └── request/[id]/
│   ├── (partner)/            ← 파트너 전용
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── rfp/
│   │   └── rfp/[id]/apply/
│   ├── (admin)/              ← 운영자 전용
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── requests/
│   │   ├── partners/
│   │   └── meetings/
│   └── api/                  ← Route Handlers
├── components/
│   ├── ui/                   ← shadcn/ui
│   └── forms/                ← 폼 컴포넌트
├── lib/
│   ├── supabase/
│   │   ├── server.ts         ← 서버 클라이언트
│   │   ├── client.ts         ← 브라우저 클라이언트
│   │   └── admin.ts          ← service_role (서버 only)
│   ├── auth.ts               ← 권한 헬퍼
│   └── email/                ← Resend 템플릿
└── types/
    └── database.ts           ← Supabase 자동 생성 타입
```

---

## 8. 명명 규칙

### 8.1 DB
- 테이블명: `snake_case`, 복수형 (`matching_requests`, `partners`)
- 컬럼명: `snake_case` (`created_at`, `partner_id`)
- 외래키: `{대상테이블단수}_id` (`partner_id`, `request_id`)
- 상태값: enum 또는 check constraint, 한글 절대 금지 (코드에서는 영문, UI에서만 한글)

### 8.2 코드
- 컴포넌트: `PascalCase` (`MatchingRequestForm.tsx`)
- 함수·변수: `camelCase` (`getMatchingRequest`)
- 상수: `UPPER_SNAKE` (`MAX_CANDIDATES = 3`)
- 한글 변수명/주석은 비즈니스 로직 설명에만 허용, 변수명 자체는 영문

### 8.3 라우트
- 한글 URL 금지 (`/매칭요청` ❌ → `/request/new` ✅)
- kebab-case (`/access-grants/new`)

---

## 9. 권한 (Row Level Security)

모든 테이블에 **RLS 활성화 필수**. 정책은 `db/migrations/002_rls.sql` 참조.

### 9.1 핵심 원칙
- **광고주**: 자기가 만든 `matching_requests`와 그 하위 `candidates`, `meetings`, `access_grants`, `ad_spend_history`만 접근
- **파트너**: 자기에게 발송된 `rfp_notifications`, 자기가 제출한 `applications`, 자기가 후보로 선정된 `candidates`만 접근
- **운영자**: 전체 접근. 단, `auth.users.raw_app_meta_data.role = 'admin'` 클레임으로 판별
- **공개**: 없음 (등록 신청서조차 anon 키로 insert만 허용)

### 9.2 service_role 사용 금지 원칙
서버 컴포넌트에서도 가능하면 사용자 세션으로 RLS를 거치게 하고, service_role은 **다음 경우에만**:
- 운영자 알림 일괄 발송
- n8n webhook 처리
- 백그라운드 정산 잡

---

## 10. 위험요소·미해결 의사결정

다음 항목들은 **MVP 진행 중에도 계속 모니터링**이 필요합니다.

### 10.1 RFP 발송 — 입점사가 늘어나면 스팸화 위험
- 현재 결정: 계약완료 대행사 전원 발송 (사용자 의사결정)
- 트리거: 입점사 30개 돌파 시 카테고리 필터링 도입 검토

### 10.2 상위 3개사 선정 기준 미문서화
- 운영자 일관성 유지가 어려움
- 트리거: 운영자 2명 이상 되면 점수표(rubric) 도입

### 10.3 광고비 소진 신고의 신뢰성
- 현재: 광고주가 지난 3개월 광고비 업로드(분석용)
- Phase 2 정산 단계에서는 매월 소진액 검증 메커니즘 필요 (광고주 + 대행사 양쪽 신고 교차검증)

### 10.4 "대행 성사" 시점 정의
- 가계약 = `deals.status = 'contracted'` (대행계약서 작성 시점)
- 진계약 = `deals.status = 'active'` (매체 이관 완료 시점, 수수료 발생 확정)

### 10.5 전자계약 플랫폼
- 글로싸인 유지. 한도 소진 시 모두싸인으로 이전 검토
- 구글 eSignature는 **선택지에서 제외** (한국 표준 아님, 법적 효력 약함)

### 10.6 매체 이관 절차의 자동화 한계
- 매체사별 권한 위임 방식이 다름 (메타 BM, 구글 MCC, 네이버 권한위탁)
- MVP: 운영자 알림 → 수동 안내 워크플로우
- Phase 2: 각 매체별 안내 템플릿 자동 발송

---

## 11. MVP 범위 (확정)

다음 기능만 MVP에 포함합니다. 나머지는 Phase 2.

### 포함 (MVP)
- [x] 광고주 회원가입·로그인
- [x] 매칭요청 접수+관리 (시스템 내 폼)
- [x] 운영자 매칭/추천 어드민 (상위 3개사 선정)
- [x] 클라이언트가 후보 확인+선택
- [x] 미팅 일정 자체 조율 (광고주 우선 선택 → 대행사 응답)
- [x] 파트너 자체 로그인 + RFP 열람 + 지원서 제출
- [x] 글로싸인 계약서 링크 첨부 (수동)
- [x] 분석권한 부여 워크플로우 (지난 3개월 광고비 업로드)
- [x] 화상미팅 링크 발송 (수동, 미팅 2-3일 전)
- [x] 메일 알림 (Resend) — 주요 이벤트마다

### Phase 2 — 마케터 매칭 (2026-06-26 완료)
- [x] 마케터 공개 랜딩/로스터/프로필 (`/marketer-matching`, `/marketers`, `/marketers/[slug]`)
- [x] 운영자 마케터 관리 CRUD (`/admin/marketers`, 공개 토글, 계정 발급)
- [x] 사례 CMS (`/cases`, `/cases/[slug]`, `/admin/cases`)
- [x] 마케터 매칭 신청 루프 (브랜드 신청 → 운영자 마케터 제안·인터뷰·확정 → 광고주 확인)
- [x] 마케터 로그인 포털 (`/marketer-console`, 본인 프로필 자가 수정)

### Phase 3 — 운영 고도화 (자체 구현분 2026-06-26 완료)
- [x] 월별 정산 산정 + 세금계산서 발행정보 관리 (`/admin/settlements`)
- [x] 카테고리 기반 RFP 발송 필터 (옵션)
- [x] 매체 이관(권한위임) 표준 안내
- [x] 인앱 알림 센터 (사이드바 벨)

### 보류 (외부 크리덴셜·가맹·OAuth 필요)
- [ ] 글로싸인 **API** 자동 발송 (수동 링크는 동작 중)
- [ ] 결제 (PG/에스크로)
- [ ] 카카오 알림톡 (비즈채널 + 템플릿 승인)
- [ ] 광고주 매체사 계정 OAuth 자동 동기화
- [ ] 채팅·메시징 (독립 시스템)
- [ ] 상위 3개사 자동 점수화 (운영자 2명+ 시점, §10.2)

---

## 12. 작업 원칙 — Claude Code 행동 규범

이 프로젝트에서 작업할 때:

1. **새 파일을 만들기 전에 항상 이 문서를 재확인** — 결정사항을 위반하는 코드를 짜지 마세요.
2. **`docs/DECISIONS.md`에 의사결정 로그 남기기** — "왜 이렇게 했는가"를 기록.
3. **DB 변경은 반드시 마이그레이션 파일로** — 수동 SQL 실행 금지.
4. **RLS 없이 테이블 만들지 말 것** — 새 테이블에는 즉시 RLS 정책 추가.
5. **타입 안전성** — `any` 사용 금지. Supabase에서 타입 생성 후 사용.
6. **에러 처리** — try-catch 없이 외부 API 호출 금지.
7. **한국어 우선** — UI 텍스트는 한국어, 코드 식별자는 영문.
8. **테스트** — MVP 단계에서는 핵심 비즈니스 로직(정산 계산, 권한 체크)만 테스트.
9. **모르는 결정은 사용자에게** — 추측하지 말고 정기윤 과장님에게 질문.
10. **n8n 자동화는 건드리지 말 것** — 사용자가 직접 운영하는 영역. DB Webhook만 제공.

---

## 13. 빠른 참조

- 운영자 (Owner): 정기윤 과장
- 호스팅 도메인: `app.teamfirst.kr` (예정)
- 기존 마케팅 사이트: 아임웹 (`teamfirst.kr`)
- Tally 폼 3종: 위 5번 표 참조
- 디자인 토큰: Pretendard Variable, navy 계열 (`#0F172A`, `#111E38`, `#004AAD`)
