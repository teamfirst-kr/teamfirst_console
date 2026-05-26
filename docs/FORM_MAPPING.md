# Form Mapping: Tally → 신규 시스템

> **작성 상태**: 스켈레톤. 실제 Tally 폼 필드를 1:1 매핑해서 채워야 함.
> 정기윤 과장님이 각 Tally 폼의 필드 목록을 공유해주시면 완성.

---

## 1. 대행사 등록신청서

- **Tally URL**: https://tally.so/r/mRA0ld
- **신규 시스템 라우트**: `/partner/apply`
- **저장 위치**: `partners` + `partner_categories`
- **공개 여부**: 비로그인 가능 (anon 키로 insert)
- **승인 워크플로우**: 운영자 검토 → 글로싸인 발송 → 계약 완료 → 계정 발급

### 필드 매핑 표

| Tally 필드 | 신규 시스템 필드 | DB 컬럼 | 타입 | 비고 |
|---|---|---|---|---|
| (예) 회사명 | 회사명 | `partners.company_name` | TEXT | 필수 |
| (예) 사업자등록번호 | 사업자등록번호 | `partners.biz_reg_no` | TEXT | 필수, unique |
| (예) 대표자명 | 대표자 | `partners.representative` | TEXT | |
| (예) 설립연도 | 설립연도 | `partners.established_year` | INT | |
| (예) 인원 규모 | 인원 | `partners.staff_size` | TEXT | 20인 미만은 "20명 미만"으로 통일 |
| (예) 전문 분야 (복수) | 카테고리 | `partner_categories.category` | TEXT[] | 다대다 |
| (예) 포트폴리오 URL | 포트폴리오 | `partners.portfolio` | JSONB | |
| (예) 강점 | 강점 키워드 | `partners.strengths` | TEXT[] | |
| (예) 주요 클라이언트 | 주요 클라이언트 | `partners.notable_clients` | TEXT[] | |
| (예) 담당자 이름 | 담당자 | `partners.contact_person` | TEXT | |
| (예) 담당자 이메일 | 담당자 이메일 | `partners.contact_email` | TEXT | 필수, 추후 계정 발급용 |
| (예) 담당자 연락처 | 담당자 연락처 | `partners.contact_phone` | TEXT | |

> ⚠️ **위 표는 예시입니다.** 실제 Tally 폼 필드를 확인 후 완성하세요.

### 시스템 폼 추가 사항
- 사업자등록증 파일 업로드 (Supabase Storage)
- 개인정보 처리방침 동의 체크박스
- reCAPTCHA (스팸 방지)

---

## 2. 매칭 요청서 (브리프)

- **Tally URL**: https://tally.so/r/3yBY1W
- **신규 시스템 라우트**: `/client/request/new`
- **저장 위치**: `matching_requests`
- **공개 여부**: 로그인 필요 (client 역할)
- **제출 후**: `matching_requests.status = 'submitted'` → 운영자 확인 → RFP 발송

### 필드 매핑 표

| Tally 필드 | 신규 시스템 필드 | DB 컬럼 | 타입 | 비고 |
|---|---|---|---|---|
| (예) 회사명 | 회사명 | `clients.company_name` | TEXT | clients에 저장 (재사용) |
| (예) 업종 | 업종 | `clients.industry` | TEXT | |
| (예) 캠페인 목적 | 캠페인 목적 | `matching_requests.brief.campaign_goal` | JSONB | |
| (예) 타겟 고객 | 타겟 | `matching_requests.brief.target_audience` | JSONB | |
| (예) 운영 희망 채널 (복수) | 채널 | `matching_requests.preferred_channels` | ad_platform[] | enum |
| (예) 월 예산 | 월 예산 | `matching_requests.budget_monthly` | BIGINT | 원 단위 |
| (예) 운영 기간 | 운영 기간 | `matching_requests.duration_months` | INT | |
| (예) 현재 대행사 | 기존 대행사 | `matching_requests.brief.current_agency` | JSONB | |
| (예) KPI | KPI | `matching_requests.brief.kpi` | JSONB | |
| (예) 추가 요청사항 | 추가 메모 | `matching_requests.brief.notes` | JSONB | |

> ⚠️ **위 표는 예시입니다.** 실제 Tally 폼 필드를 확인 후 완성하세요.

### 시스템 폼 추가 사항
- 단계별 폼 (Multi-step) — 5-6단계로 분할해서 부담 줄임
- 임시 저장 기능 (`status = 'draft'`)
- 광고주가 다음 요청 시 회사 정보 자동 채움

---

## 3. 광고대행 지원서 (RFP 응답)

- **Tally URL**: https://tally.so/r/lbBZNB
- **신규 시스템 라우트**: `/partner/rfp/[id]/apply`
- **저장 위치**: `applications`
- **공개 여부**: 로그인 필요 (partner 역할, contracted 상태)
- **제출 후**: `applications.status = 'submitted'` → 운영자 검토 → 상위 3개사 선정

### 필드 매핑 표

| Tally 필드 | 신규 시스템 필드 | DB 컬럼 | 타입 | 비고 |
|---|---|---|---|---|
| (예) 제안 개요 | 제안 개요 | `applications.proposal.approach` | JSONB | |
| (예) 투입 팀 구성 | 팀 구성 | `applications.proposal.team_composition` | JSONB | |
| (예) 유사 케이스 | 유사 사례 | `applications.proposal.similar_cases` | JSONB | |
| (예) 차별점 | 차별점 | `applications.proposal.differentiation` | JSONB | |
| (예) 월 견적 | 월 견적 | `applications.quote_monthly` | BIGINT | 원 단위 |
| (예) 가능 시작일 | 시작 가능일 | `applications.start_available` | DATE | |
| (예) 제안서 파일 | 첨부파일 | `applications.attachments` | JSONB | Storage |

> ⚠️ **위 표는 예시입니다.** 실제 Tally 폼 필드를 확인 후 완성하세요.

### 시스템 폼 추가 사항
- 광고주의 요청 내용을 항상 화면에 노출 (참조용)
- 광고주가 업로드한 지난 3개월 광고비 데이터 노출 (분석권한 부여 후)
- 임시 저장 기능

---

## 4. 마이그레이션 전략 — 기존 Tally 응답

기존 Tally에 들어와 있는 응답들은 어떻게 신규 시스템으로 이전할지:

### Option A — 일괄 이관 (권장)
- Tally의 CSV/Excel export → 스크립트로 신규 DB에 일괄 insert
- 단점: 사용자에게 이메일 통보 필요 (계정 생성 안내)

### Option B — 신규 요청부터 신규 시스템
- 기존 응답은 Tally에 그대로 두고, 새 요청만 신규 시스템으로
- 장점: 마이그레이션 부담 없음
- 단점: 데이터 분산

### Option C — 점진적 (혼합)
- 진행 중인 매칭 건만 수기 이관
- 종료된 건은 Tally에 보관, 신규는 신규 시스템

> **결정 필요**: 사용자가 8주차 작업 시작 전에 선택.

---

## 작업 체크리스트

`pnpm dev` 환경에서 각 폼을 만들 때:

- [ ] `react-hook-form` + `zod` 스키마 정의
- [ ] Tally 폼과 동일 필수 필드 확인
- [ ] 임시 저장 (draft 상태) 지원
- [ ] 모바일 반응형 확인
- [ ] 제출 후 안내 메일 발송 (Resend)
- [ ] 운영자 대시보드에서 즉시 보이는지 확인
