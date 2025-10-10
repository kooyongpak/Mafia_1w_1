-- ============================================================
-- Migration: Unify Recruitment Count Column
-- Description: max_participants를 recruitment_count로 통일
-- Note: 실제 DB에 max_participants와 recruitment_count 둘 다 있을 경우 처리
-- ============================================================

BEGIN;

-- ============================================================
-- 1. 컬럼 존재 여부 확인 및 데이터 마이그레이션
-- ============================================================

-- max_participants 컬럼이 있다면 데이터를 recruitment_count로 복사
DO $$
BEGIN
  -- max_participants 컬럼이 존재하는지 확인
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'campaigns'
    AND column_name = 'max_participants'
  ) THEN
    -- max_participants 값을 recruitment_count로 복사 (recruitment_count가 NULL인 경우만)
    UPDATE campaigns
    SET recruitment_count = max_participants
    WHERE recruitment_count IS NULL AND max_participants IS NOT NULL;

    -- max_participants 컬럼의 NOT NULL 제약 조건 제거
    ALTER TABLE campaigns ALTER COLUMN max_participants DROP NOT NULL;

    -- max_participants 컬럼 삭제
    ALTER TABLE campaigns DROP COLUMN max_participants;

    RAISE NOTICE 'max_participants 컬럼을 recruitment_count로 통합했습니다.';
  ELSE
    RAISE NOTICE 'max_participants 컬럼이 존재하지 않습니다. 건너뜁니다.';
  END IF;
END $$;

-- ============================================================
-- 2. recruitment_count 컬럼 제약 조건 보강
-- ============================================================

-- recruitment_count NULL 값을 10으로 설정
UPDATE campaigns
SET recruitment_count = 10
WHERE recruitment_count IS NULL;

-- recruitment_count NOT NULL 제약 추가
DO $$
BEGIN
  BEGIN
    ALTER TABLE campaigns
      ALTER COLUMN recruitment_count SET NOT NULL;
  EXCEPTION
    WHEN others THEN
      RAISE NOTICE 'recruitment_count NOT NULL 제약이 이미 존재합니다.';
  END;
END $$;

-- recruitment_count CHECK 제약 추가
DO $$
BEGIN
  -- 기존 max_participants check 제약 삭제
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'campaigns_max_participants_check'
  ) THEN
    ALTER TABLE campaigns DROP CONSTRAINT campaigns_max_participants_check;
    RAISE NOTICE 'campaigns_max_participants_check 제약을 삭제했습니다.';
  END IF;

  -- recruitment_count check 제약 추가
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'campaigns_recruitment_count_check'
  ) THEN
    ALTER TABLE campaigns
      ADD CONSTRAINT campaigns_recruitment_count_check
      CHECK (recruitment_count > 0);
    RAISE NOTICE 'campaigns_recruitment_count_check 제약을 추가했습니다.';
  END IF;
END $$;

COMMIT;

-- ============================================================
-- 검증: campaigns 테이블 구조 확인
-- ============================================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'campaigns'
AND column_name IN ('recruitment_count', 'max_participants')
ORDER BY column_name;
