-- ============================================================================
-- 016: deals(request_id) 유니크 제약
-- Date: 2026-07-14
--
-- decideWinner가 동시에 두 번 실행되면(더블 클릭/운영자 2명) 존재 확인을 둘 다
-- 통과해 한 요청에 deal이 2건 생길 수 있다 → 정산 화면에 중복 노출.
-- 요청당 deal 1건 규칙을 DB 레벨에서 강제한다.
-- ============================================================================

-- 혹시 이미 중복이 있으면 가장 먼저 생성된 것만 남긴다.
DELETE FROM public.deals d
USING public.deals d2
WHERE d.request_id = d2.request_id
  AND d.created_at > d2.created_at;

ALTER TABLE public.deals
  ADD CONSTRAINT deals_request_id_unique UNIQUE (request_id);
