-- 동기화 확장: daily_scores에 riseReaders 컬럼 + profiles에 JSON 데이터 추가
-- Supabase SQL Editor에서 실행

-- 1) daily_scores에 riseReaders 카테고리 추가
ALTER TABLE public.daily_scores
  ADD COLUMN IF NOT EXISTS "riseReaders" integer NOT NULL DEFAULT 0;

-- 2) profiles에 칭찬기록 + 스티커나무 JSON 저장
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS praise_log jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sticker_forest jsonb DEFAULT '{"trees":[null,null]}',
  ADD COLUMN IF NOT EXISTS theme text DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS admin_pin text DEFAULT '1234';
