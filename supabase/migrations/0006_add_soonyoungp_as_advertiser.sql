-- ============================================================
-- Migration: Add soonyoungp@gmail.com as Advertiser
-- Description: soonyoungp@gmail.com 계정을 광고주로 등록
-- ============================================================

BEGIN;

-- 1. users 테이블에 사용자 추가
INSERT INTO users (
  auth_user_id,
  name,
  phone,
  email,
  role,
  created_at,
  updated_at
)
VALUES (
  '59197818-9d2b-4f0b-97fd-0a3069b297b9',
  '박순영',
  '010-1234-5678',
  'soonyoungp@gmail.com',
  'advertiser',
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET
  role = 'advertiser',
  updated_at = NOW();

-- 2. advertiser_profiles 테이블에 광고주 프로필 추가
INSERT INTO advertiser_profiles (
  user_id,
  company_name,
  location,
  category,
  business_registration_number,
  is_verified,
  created_at,
  updated_at
)
SELECT
  u.id,
  '테스트 광고주',
  '서울시 강남구',
  '뷰티',
  '123-45-67890',
  true,
  NOW(),
  NOW()
FROM users u
WHERE u.email = 'soonyoungp@gmail.com'
ON CONFLICT (user_id) DO UPDATE
SET
  company_name = '테스트 광고주',
  location = '서울시 강남구',
  category = '뷰티',
  is_verified = true,
  updated_at = NOW();

COMMIT;

-- ============================================================
-- 검증: 등록된 데이터 확인
-- ============================================================
SELECT
  u.id as user_id,
  u.email,
  u.role,
  ap.id as advertiser_profile_id,
  ap.company_name,
  ap.category
FROM users u
LEFT JOIN advertiser_profiles ap ON u.id = ap.user_id
WHERE u.email = 'soonyoungp@gmail.com';
