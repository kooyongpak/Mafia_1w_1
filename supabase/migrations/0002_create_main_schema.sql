-- ============================================================
-- Migration: Create Main Schema
-- Description: 사용자, 인플루언서, 광고주, 체험단, 지원 관련 테이블 생성
-- ============================================================

BEGIN;

-- ============================================================
-- Helper: updated_at 자동 업데이트 트리거 함수
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. 사용자 & 인증
-- ============================================================

-- users 테이블
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('influencer', 'advertiser')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- users updated_at 트리거
DROP TRIGGER IF EXISTS set_timestamp_users ON users;
CREATE TRIGGER set_timestamp_users
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- RLS 비활성화
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- user_agreements 테이블
CREATE TABLE IF NOT EXISTS user_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agreement_type VARCHAR(50) NOT NULL,
  agreed BOOLEAN NOT NULL DEFAULT FALSE,
  agreed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_agreements_user_id ON user_agreements(user_id);

-- RLS 비활성화
ALTER TABLE user_agreements DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. 인플루언서 프로필
-- ============================================================

-- influencer_profiles 테이블
CREATE TABLE IF NOT EXISTS influencer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  birth_date DATE NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_influencer_profiles_user_id ON influencer_profiles(user_id);

-- influencer_profiles updated_at 트리거
DROP TRIGGER IF EXISTS set_timestamp_influencer_profiles ON influencer_profiles;
CREATE TRIGGER set_timestamp_influencer_profiles
  BEFORE UPDATE ON influencer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- RLS 비활성화
ALTER TABLE influencer_profiles DISABLE ROW LEVEL SECURITY;

-- influencer_channels 테이블
CREATE TABLE IF NOT EXISTS influencer_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES influencer_profiles(id) ON DELETE CASCADE,
  channel_type VARCHAR(50) NOT NULL,
  channel_name VARCHAR(255) NOT NULL,
  channel_url TEXT NOT NULL,
  verification_status VARCHAR(20) DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'success', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_influencer_channels_influencer_id ON influencer_channels(influencer_id);
CREATE INDEX IF NOT EXISTS idx_influencer_channels_verification_status ON influencer_channels(verification_status);

-- influencer_channels updated_at 트리거
DROP TRIGGER IF EXISTS set_timestamp_influencer_channels ON influencer_channels;
CREATE TRIGGER set_timestamp_influencer_channels
  BEFORE UPDATE ON influencer_channels
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- RLS 비활성화
ALTER TABLE influencer_channels DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. 광고주 프로필
-- ============================================================

-- advertiser_profiles 테이블
CREATE TABLE IF NOT EXISTS advertiser_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  location TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  business_registration_number VARCHAR(50) UNIQUE NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advertiser_profiles_user_id ON advertiser_profiles(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_advertiser_profiles_business_reg_num
  ON advertiser_profiles(business_registration_number);

-- advertiser_profiles updated_at 트리거
DROP TRIGGER IF EXISTS set_timestamp_advertiser_profiles ON advertiser_profiles;
CREATE TRIGGER set_timestamp_advertiser_profiles
  BEFORE UPDATE ON advertiser_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- RLS 비활성화
ALTER TABLE advertiser_profiles DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. 체험단 (캠페인)
-- ============================================================

-- campaigns 테이블
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES advertiser_profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  benefits TEXT NOT NULL,
  mission TEXT NOT NULL,
  store_info TEXT NOT NULL,
  recruitment_count INTEGER NOT NULL CHECK (recruitment_count > 0),
  recruitment_start_date DATE NOT NULL,
  recruitment_end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'recruiting'
    CHECK (status IN ('recruiting', 'closed', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_recruitment_period
    CHECK (recruitment_end_date >= recruitment_start_date)
);

CREATE INDEX IF NOT EXISTS idx_campaigns_advertiser_id ON campaigns(advertiser_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_campaigns_recruitment_dates
  ON campaigns(recruitment_start_date, recruitment_end_date);

-- campaigns updated_at 트리거
DROP TRIGGER IF EXISTS set_timestamp_campaigns ON campaigns;
CREATE TRIGGER set_timestamp_campaigns
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- RLS 비활성화
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. 체험단 지원
-- ============================================================

-- applications 테이블
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  visit_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'selected', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_application UNIQUE(campaign_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_campaign_id ON applications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_user_status ON applications(user_id, status);

-- applications updated_at 트리거
DROP TRIGGER IF EXISTS set_timestamp_applications ON applications;
CREATE TRIGGER set_timestamp_applications
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_timestamp();

-- RLS 비활성화
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;

COMMIT;

-- ============================================================
-- Migration 완료
-- ============================================================
