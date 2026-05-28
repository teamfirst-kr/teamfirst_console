# Decisions Log

> 모든 중대한 의사결정을 시간순으로 기록합니다.
> 새 결정이 생기면 맨 아래에 추가하세요.
>
> 형식: 날짜 / 주제 / 결정 / 근거 / 영향

---

## 2026-05-26 — 초기 설계 회의

### D-001. 신규 시스템은 아임웹에서 분리
- **결정**: 아임웹 사이트(`teamfirst.kr`)는 마케팅용으로 유지. 운영 시스템은 별도 서브도메인 `app.teamfirst.kr`에 Next.js + Supabase로 신규 구축.
- **근거**: 아임웹의 CSS 오버라이드, 풀와이드 배경 불가, SSH 접근 불가, 위젯별 수동 붙여넣기 등의 제약이 운영 시스템에는 부적합.
- **영향**: 두 도메인 동시 운영. SEO는 본 도메인에 집중, 운영은 서브도메인에서.

### D-002. 사용자 역할 3종 (MVP)
- **결정**: 광고주(client) / 파트너(partner) / 운영자(admin) 3종. 마케터(marketer) 양면 플랫폼은 **Phase 2로 완전 미룸**.
- **근거**: MVP 범위 축소. 양면 플랫폼 동시 출시는 리스크 큼.
- **영향**: DB enum `user_role`은 4개 값 정의하되 marketer는 코드 분기 없음.

### D-003. 3개 폼 분리 유지
- **결정**: 대행사 등록신청서(`mRA0ld`), 매칭 요청서(`3yBY1W`), 광고대행 지원서(`lbBZNB`) — 3개 폼은 신규 시스템에서도 분리된 라우트로 유지.
- **근거**: 사용자가 이미 분리해서 운영 중. 신규 입점 vs 기존 입점의 RFP 지원은 의미가 다름.
- **영향**: `/partner/apply`(공개), `/client/request/new`(로그인), `/partner/rfp/[id]/apply`(로그인) 3개 라우트.

### D-004. RFP 발송 범위 — 계약완료 대행사 전원
- **결정**: 매칭 요청 제출 시 RFP는 `partners.status = 'contracted'` 전원에게 발송. 카테고리 필터링 없음.
- **근거**: 현재 입점사 수가 적어 전원 발송이 효율적. 사용자 결정.
- **영향**: `rfp_notifications` 자동 생성 로직은 단순. 단, 입점사 30개 돌파 시 재검토 필요.

### D-005. 상위 3개사는 운영자 수동 큐레이션
- **결정**: 자동 점수화 없음. 운영자가 지원서를 보고 상위 3개사를 직접 선정.
- **근거**: 도메인 지식 기반의 정성적 판단이 중요. 자동화는 데이터 누적 후.
- **영향**: 운영자 어드민에 비교 뷰 + 선정 UI 필요.

### D-006. 분석권한과 관리권한은 별개 워크플로우
- **결정**: 
  - 분석권한(`analysis`): 미팅 전 광고주 동의로 임시 부여. 지난 3개월 광고비 분석용.
  - 관리권한(`management`): 본격 계약 후 매체사로부터 공식 인정받는 이관 절차.
- **근거**: 사용자가 두 단계를 명확히 구분해서 설명함.
- **영향**: `access_grants.grant_type` enum 분리. UI 흐름도 분리.

### D-007. 광고비 소진액 추적 — 광고주가 지난 3개월 업로드
- **결정**: 미팅 전 광고주가 지난 3개월 매체별 광고비를 시스템에 업로드. 분석권한 부여의 근거.
- **근거**: 사용자 결정. 시스템 외부 데이터 의존성 최소화.
- **영향**: `ad_spend_history` 테이블. MVP는 분석용만, 매월 정산 추적은 Phase 2.

### D-008. 미팅 후 7일 데드라인
- **결정**: 화상미팅 후 7일 이내 대행 여부 결정. 5일째 양쪽에 자동 리마인드.
- **근거**: 잠수 방지. 운영 효율.
- **영향**: 백그라운드 잡 또는 n8n 워크플로우로 리마인드 자동 발송.

### D-009. 수수료 모델 — 대행수수료의 일부를 팀퍼스트가 받음
- **결정**:
  - 공식대행 매체(네이버, 카카오): 매체사 환급분 15% 중 일부.
  - 비공식대행 매체(구글, 메타, 틱톡): 광고주 청구 마크업(10-15%) 중 일부.
- **근거**: 사용자 설명.
- **영향**: `deals.media_type`, `deals.partner_fee_rate`, `deals.teamfirst_share_rate` 컬럼 분리.

### D-010. 1% 프로모션 종료 (2026년 6월)
- **결정**: 2026년 6월부로 첫 매칭 1% 프로모션 종료. **신규 시스템에 흔적 남기지 말 것**.
- **근거**: 사용자 결정.
- **영향**: 코드/DB에 프로모션 관련 컬럼·로직 없음.

### D-011. "대행 성사" 2단계 정의
- **결정**:
  - 가계약(`deals.status = 'contracted'`): 대행계약서 작성 시점.
  - 진계약(`deals.status = 'active'`): 매체 이관 완료 시점, 수수료 발생 확정.
- **근거**: 매체 이관 전에는 실제 수수료 발생 불확실.
- **영향**: 정산 로직은 `active` 이후 시점부터.

### D-012. 전자계약 플랫폼 — 글로싸인 유지
- **결정**: 글로싸인 당분간 수동 발송으로 운영. 한도 소진 시 모두싸인으로 이전 검토. **구글 eSignature는 제외**.
- **근거**: 한국 표준 계약 방식. 구글 eSignature는 법적 효력·한국 비즈니스 적합성 부족.
- **영향**: `contracts` 테이블에 `glosign_doc_id` 컬럼. API 자동화는 Phase 2.

### D-013. 기술 스택 확정
- **결정**: Next.js 15 + TypeScript + Tailwind + shadcn/ui + Supabase + Resend + Vercel + n8n.
- **근거**: 1인 + Claude Code 페어로 운영 가능한 최소 스택. 사용자 기존 도구(n8n) 유지.
- **영향**: 추가 ORM, 별도 백엔드, 별도 인증 서버 도입 금지.

### D-014. RLS 필수
- **결정**: 모든 테이블에 RLS 활성화. service_role 사용은 운영자 백오피스·n8n 처리·백그라운드 잡에만.
- **근거**: 양면 플랫폼의 데이터 격리.
- **영향**: 새 테이블 추가 시 즉시 RLS 정책 작성 필수.

### D-015. 개발 리소스
- **결정**: 정기윤 과장 1인 + Claude Code 페어. 8주 MVP.
- **근거**: 사용자 결정.
- **영향**: 일정 압축. 자동 테스트는 핵심 비즈니스 로직만.

---

## 2026-05-26 — 1주차 셋업 마무리 & 누락 위험요소 보강

### D-016. 자가가입 범위 — 광고주만
- **결정**: `/signup` 폼은 광고주(`role = 'client'`)만 받는다. 파트너 계정은 `/partner/apply` 등록 신청 → 운영자 승인 → 운영자가 발급. 운영자 계정은 Supabase 대시보드에서 raw_user_meta_data로 발급.
- **근거**: CLAUDE.md §2. 양면 플랫폼이지만 파트너 계정 발급에는 검토가 필요.
- **영향**: `db/migrations/003_auth_trigger.sql`이 `auth.users` 생성 시 `public.users`를 만들고, role이 `client`인 경우에만 빈 `clients` 행도 동시 생성.

### D-017. 라우트 가드는 layout 레벨에서
- **결정**: `(client)`/`(partner)`/`(admin)` 라우트 그룹의 `layout.tsx`에서 `requireRole()` 호출. 미일치 시 `roleHome()`으로 리다이렉트.
- **근거**: middleware는 세션 갱신만 담당. 역할 체크는 DB 조회가 필요해 서버 컴포넌트에서 수행.
- **영향**: 모든 보호된 페이지는 반드시 해당 라우트 그룹 아래에 둘 것.

### D-018. 떨어진 대행사 자동 통보 (4주차 보강)
- **결정**: 운영자가 상위 3개사 선정 확정 시점에 미선정 지원자(`applications.status = 'rejected'`)에게 정중한 안내 메일 자동 발송. 다음 RFP 안내 포함.
- **근거**: 이전 대화 위험요소 ④. 대행사 이탈 방지.
- **영향**: 5주차 "상위 3개사 선정 UI"에 미선정 통보 메일 발송 액션 추가. Resend 템플릿 1종 필요.

### D-019. 광고비 신고 교차검증 (Phase 2 정산 자동화)
- **결정**: Phase 2 정산 단계에서 광고주 + 대행사 양쪽 신고를 모두 받고, 차이가 있을 경우 운영자 알림. 추가로 운영자가 분기 1회 무작위 감사.
- **근거**: 이전 대화 위험요소 ②. 대행사가 실제보다 적게 신고할 동기 차단.
- **영향**: `settlements` 테이블에 신고 주체별 컬럼이 추가될 가능성. MVP 스키마 변경 없음.

### D-020. 상위 3개사 선정 점수표(rubric) 도입 트리거
- **결정**: 운영자가 1명인 동안은 정성적 큐레이션 유지. 운영자 2명 이상 또는 월 매칭 요청 20건 돌파 시 점수표 도입 검토. 항목 예: 업종경험·예산적합도·인력가용성·과거성과·차별성.
- **근거**: 이전 대화 위험요소 ③. 일관성·설명가능성.
- **영향**: 트리거 도달 전까지 코드 변경 없음. 도입 시 `applications`에 점수 컬럼 또는 별도 `application_scores` 테이블 추가.

## 2026-05-26 — 2주차 시작: UI 레퍼런스 + 파트너 신청 폼

### D-021. UI/UX 레퍼런스 = OnePoint
- **결정**: 유사 매칭 플랫폼 OnePoint의 UI 패턴을 차용. 단, 컬러는 TeamFirst 정체성(navy `#004AAD` primary, `#111E38` secondary) 유지.
- **차용 패턴**:
  1. 다크 사이드바(`bg-secondary`) + 라이트 콘텐츠 영역
  2. 흰 카드 + 둥근 모서리 + 여유 패딩, 회사명은 primary blue
  3. 빈 상태: 점선 박스 + 아이콘 원형 배경 + 안내 문구
  4. 통계 카드: primary 헤더 + 큰 숫자 + 보조 hint
  5. 후기/태그: blue pill 배지 (`Badge` 컴포넌트)
  6. 지원서 폼: 섹션 헤더 underline + textarea char counter + 풀폭 primary CTA (4주차 적용)
  7. 정산 카드: divider row + 우측 정렬 금액 + 강조 합계 (Phase 2 정산 화면에 적용)
- **근거**: 입증된 양면 매칭 플랫폼의 UI는 학습된 사용자 멘탈 모델이 있어 도입 마찰이 적음.
- **영향**: `AppShell`을 사이드바 레이아웃으로 리팩토링. `EmptyState`, `Badge` 컴포넌트 도입.

### D-022. /partner/apply는 RLS anon insert 정책에 의존
- **결정**: 파트너 등록 신청 폼은 미인증 anon 키로 직접 `partners` insert. `partners_insert_anon` 정책이 `status='pending' AND user_id IS NULL`만 허용하므로 안전.
- **근거**: service_role 우회 최소화 원칙(CLAUDE.md §9.2). 운영자 개입 없이 신청 접수 가능.
- **영향**: 사업자등록증·포트폴리오 파일 업로드는 별도 PR로 분리. Storage 정책 + multipart 처리가 추가로 필요.

### D-023. 사업자등록번호 정규화
- **결정**: 입력 시 `000-00-00000` 또는 숫자 10자리 모두 허용. DB 저장 시 하이픈 형식으로 통일.
- **근거**: `partners.biz_reg_no UNIQUE` 제약 → 표기 차이로 중복 가입 방지.
- **영향**: `lib/schemas/partner-application.ts` `normalizeBizRegNo()`.

## 2026-05-26 — 2주차 진행: 운영자 신청 처리 화면

### D-024. 파트너 상태 전이 워크플로우
- **결정**: `pending → reviewing → contracted`(또는 `rejected`) 단방향 흐름. 운영자는 다음 액션을 명시적으로 트리거.
  - `markReviewing`: pending → reviewing
  - `attachContract`: contracts 행 생성(status=sent), pending이면 reviewing으로 동시 승격
  - `markContractedAndIssueAccount`: contracts.status=signed로 마감 + partners.status=contracted + auth 계정 발급
  - `rejectPartner`: pending/reviewing → rejected. 사유는 admin_memo에 저장
- **근거**: 글로싸인은 수동 발송(CLAUDE.md §10.5)이라 시스템이 자동으로 contracted로 못 넘어감. 운영자가 신호를 줘야 함.

### D-025. 파트너 계정 발급 = service_role 사용 정당화
- **결정**: `markContractedAndIssueAccount`에서 `createAdminClient()` (service_role)로 `auth.admin.createUser` 호출. 트리거가 `public.users`를 만들고, app_metadata.role='partner'로 명시. 임시 비밀번호는 server action 응답으로 한 번만 운영자에게 노출.
- **근거**: CLAUDE.md §9.2의 "운영자 알림 일괄 발송 / n8n webhook / 백그라운드 잡"에 해당. 일반 anon/유저 세션으로는 createUser 불가.
- **영향**: 추후 Resend 붙으면 임시 비번을 운영자 화면에 노출하는 대신 메일로 직접 발송하도록 변경.

### D-026. supabase-js relational select 회피
- **결정**: `from("partners").select("..., partner_categories(category)")` 같은 중첩 select는 `types/database.ts`의 `Relationships: []`에서 `never`로 추론됨. 별도 쿼리 + Map 매핑으로 우회.
- **근거**: 자동 생성 타입(`supabase gen types`)으로 갈아끼우면 해결되지만, 그 전까지는 명시적 분리 쿼리가 안전.
- **영향**: 리스트/상세 페이지 모두 카테고리·계약 별도 fetch. 약간의 N+1 비용이 있으나 운영 화면이라 무시.

## 2026-05-26 — 2주차: 파일 업로드

### D-027. partner-files 버킷 = private + service_role 전용 접근
- **결정**: Storage 버킷 `partner-files`는 private. 익명 사용자가 신청하므로 업로드는 서버 액션에서 service_role로 처리. 운영자 다운로드도 service_role로 signed URL(10분) 생성.
- **근거**: 익명 anon 키로 Storage 직접 업로드하려면 광범위한 insert 정책이 필요해 위험. 서버 경유가 안전하고 경로를 `{partner_id}/...`로 강제 가능.
- **영향**: `db/migrations/004_storage.sql` 버킷 생성만. storage.objects RLS 정책 불필요(service_role 우회). `next.config.ts` serverActions bodySizeLimit 15mb.

### D-028. 첨부 경로는 partners.portfolio(jsonb)에 저장
- **결정**: 별도 파일 테이블 없이 `partners.portfolio = { business_registration: path, items: [{name, path}] }`로 저장.
- **근거**: MVP 단계에서 파일 메타가 단순. 스키마 변경 없이 기존 jsonb 컬럼 활용.
- **영향**: 파일당 최대 10MB, 포트폴리오 최대 5개, PDF·이미지만. 업로드 실패는 신청을 무효화하지 않고 운영자가 수동 요청.

<!-- 새 결정은 아래에 추가 -->
