-- ============================================================
-- Migration: Fix Missing Columns
-- Description: 실제 DB와 스키마가 일치하지 않는 컬럼들을 수정
-- Note: recruitment_count 컬럼 제약 조건 보강 및 프로필 테이블 is_verified 추가
-- ============================================================

BEGIN;

-- ============================================================
-- 1. campaigns 테이블 컬럼 확인 및 추가
-- ============================================================

-- recruitment_count 컬럼 기본값 설정 (NULL인 경우 10으로 설정)
UPDATE campaigns
SET recruitment_count = 10
WHERE recruitment_count IS NULL;

-- recruitment_count NOT NULL 제약 조건 추가
DO $$
BEGIN
  BEGIN
    ALTER TABLE campaigns
      ALTER COLUMN recruitment_count SET NOT NULL;
  EXCEPTION
    WHEN others THEN
      RAISE NOTICE 'recruitment_count NOT NULL constraint already exists or cannot be added';
  END;
END $$;

-- recruitment_count CHECK 제약 조건 추가 (이미 있으면 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'campaigns_recruitment_count_check'
  ) THEN
    ALTER TABLE campaigns
      ADD CONSTRAINT campaigns_recruitment_count_check
      CHECK (recruitment_count > 0);
  END IF;
END $$;

-- ============================================================
-- 2. advertiser_profiles 테이블 is_verified 컬럼 확인
-- ============================================================

-- is_verified 컬럼이 없으면 추가
ALTER TABLE IF EXISTS advertiser_profiles
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- ============================================================
-- 3. influencer_profiles 테이블 is_verified 컬럼 확인
-- ============================================================

-- is_verified 컬럼이 없으면 추가
ALTER TABLE IF EXISTS influencer_profiles
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

COMMIT;

-- ============================================================
-- Migration 완료
-- ============================================================
