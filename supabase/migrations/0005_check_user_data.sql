-- ============================================================
-- Migration: Check User Data for soonyoungp@gmail.com
-- Description: soonyoungp@gmail.com 계정의 role과 프로필 정보 확인
-- Note: 이 파일은 진단용입니다. 실제 마이그레이션이 아닙니다.
-- ============================================================

-- 1. auth.users 테이블에서 사용자 확인
SELECT
  id as auth_user_id,
  email,
  email_confirmed_at,
  created_at
FROM auth.users
WHERE email = 'soonyoungp@gmail.com';

-- 2. users 테이블에서 사용자 정보 확인
SELECT
  id,
  auth_user_id,
  name,
  email,
  role,
  created_at
FROM users
WHERE email = 'soonyoungp@gmail.com';

-- 3. advertiser_profiles 테이블에서 광고주 프로필 확인
SELECT
  ap.id as advertiser_id,
  ap.user_id,
  ap.company_name,
  ap.category,
  ap.location,
  ap.business_registration_number,
  ap.is_verified,
  u.email,
  u.role
FROM advertiser_profiles ap
JOIN users u ON ap.user_id = u.id
WHERE u.email = 'soonyoungp@gmail.com';

-- 4. 모든 users와 advertiser_profiles 관계 확인
SELECT
  u.id as user_id,
  u.email,
  u.role,
  ap.id as advertiser_profile_id,
  ap.company_name
FROM users u
LEFT JOIN advertiser_profiles ap ON u.id = ap.user_id
ORDER BY u.created_at DESC
LIMIT 10;
