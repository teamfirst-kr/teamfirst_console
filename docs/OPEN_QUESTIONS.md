# OPEN QUESTIONS — 팀퍼스트 운영 콘솔

> PRD(docs/PRD.md) 구현 중 발생한 미확정 사항을 누적 기록한다.
> 형식: 번호 · 질문 · 맥락 · 임시 결정(있다면) · 상태(OPEN/RESOLVED).

| # | 질문 | 맥락 | 임시 결정 / 진행 | 상태 |
|---|---|---|---|---|
| Q1 | 현행 아임웹 `/shop_*` 커머스(장바구니/주문)가 실제 운영에 쓰이는가? | §2.3 이관 판정 | 미사용 가정, Phase 3로 보류 | OPEN |
| Q2 | 아임웹 회원 데이터(브랜드/대행사)를 내보내 이관 가능한가? | §10.5 | 신규 가입/CSV 임포트로 시드 중 | OPEN |
| Q3 | DB를 Supabase→Prisma로 전환할 것인가, Supabase 유지인가? | §8/§10 | **Option ① — Supabase 유지** 확정(2026-06-26) | RESOLVED |
| Q4 | 라우트를 PRD대로(`/app`,`/agency-console`) 재명명할 것인가? | §5 | 현 `(client)/(partner)` 유지, 신규 라우트는 redirect 흡수 | RESOLVED |
| Q5 | RFP 산출물은 PDF/PPTX 중 무엇을 우선하나? | §10.4 | PDF 미리보기+다운로드 우선, PPTX는 옵션 | 진행 |
| Q6 | 매칭 신청 멀티스텝의 자동저장은 비회원도 허용? | §7.2 | 로그인 사용자만 서버 저장, 비회원은 로컬 임시(추후) | OPEN |
| Q7 | 운영자 평가표 6항목 vs PRD 4항목(총점/성과/콘텐츠/매칭) 정합 | §7.7 / 현 rubric 6항목 | 현 6항목 유지, PRD 4항목은 표시 그룹으로 매핑 | OPEN |
| Q8 | 팀퍼스트 정산 입금 계좌(실값) | settlements 화면 placeholder | 운영자에게 실계좌 입력 요청 필요 | OPEN |
| Q9 | 전자계약 솔루션(글로싸인 유지 vs 모두싸인) | §14 | 글로싸인 수동 유지, Phase 3 재검토 | OPEN |
| Q10 | 마케터 self_update RLS가 status/slug 변경까지 허용(앱 액션은 제한) | migration 014 | 앱 서버 액션이 허용 컬럼만 수정. 직접 호출 시 self-publish 가능(저低위험). 필요 시 BEFORE UPDATE 트리거로 비운영자 status 변경 차단 | OPEN |
| Q11 | 글로싸인 API 키 확보 가능? (전자계약 자동 발송) | Phase 3 | 현재 수동 링크 첨부로 동작. API 발급 시 자동화 | OPEN |
| Q12 | PG/에스크로 가맹(결제) 진행 여부 | Phase 3 | 현재 인보이스/입금 관리 방식. 결제 도입 시 가맹 필요 | OPEN |
| Q13 | 카카오 알림톡 비즈채널·템플릿 승인 진행 여부 | Phase 3 | 현재 Resend 이메일 + 인앱 알림. 알림톡은 채널/템플릿 승인 후 | OPEN |
| Q14 | 매체사(메타/구글/네이버) OAuth 앱 등록 가능? (계정 자동 동기화) | Phase 3 | 현재 매체 이관 수동 안내. 자동화는 매체별 OAuth 앱 심사 필요 | OPEN |
