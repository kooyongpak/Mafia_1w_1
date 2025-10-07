# 데이터베이스 설계 문서

## 데이터플로우 (간략)

### 1. 회원가입 & 역할 선택
```
Input: 이름, 휴대폰번호, 이메일, 약관동의, 역할(광고주/인플루언서)
       ↓
Processing: Supabase Auth 계정 생성
       ↓
DB Write: users (id, auth_id, name, phone, email, role)
          user_agreements (user_id, agreement_type, agreed)
       ↓
Output: 프로필 저장 완료, 역할별 온보딩 분기
```

### 2. 인플루언서 정보 등록
```
Input: 생년월일, SNS 채널 유형/채널명/URL
       ↓
DB Write: influencer_profiles (user_id, birth_date)
          influencer_channels (influencer_id, channel_type, channel_name, channel_url, verification_status)
       ↓
Output: 채널 검증 상태(검증대기/성공/실패), 지원 가능 여부
```

### 3. 광고주 정보 등록
```
Input: 업체명, 위치, 카테고리, 사업자등록번호
       ↓
DB Write: advertiser_profiles (user_id, company_name, location, category, business_registration_number)
       ↓
Output: 프로필 확정, 체험단 관리 권한 부여
```

### 4. 홈 & 체험단 목록 탐색
```
Input: 홈 접속, 필터/정렬 선택
       ↓
DB Read: campaigns WHERE status = 'recruiting'
         ORDER BY created_at DESC
         LIMIT/OFFSET (페이징)
       ↓
Output: 모집 중 체험단 리스트 렌더링
```

### 5. 체험단 상세
```
Input: 체험단 ID
       ↓
DB Read: campaigns WHERE id = :campaign_id
         (기간, 혜택, 미션, 매장, 모집인원)
         + 권한 체크 (influencer_profiles 존재 여부)
       ↓
Output: 체험단 상세 표시, 지원 버튼 노출 여부
```

### 6. 체험단 지원
```
Input: 각오 한마디, 방문 예정일자
       ↓
Validation: 중복 지원 방지 (UNIQUE constraint)
            모집기간 내 여부 확인
       ↓
DB Write: applications (campaign_id, user_id, message, visit_date, status='pending')
       ↓
Output: 제출 성공, 내 지원 목록에 반영
```

### 7. 내 지원 목록 (인플루언서)
```
Input: 상태 필터 선택
       ↓
DB Read: applications WHERE user_id = :user_id
         [AND status = :status]
         JOIN campaigns
       ↓
Output: 지원 목록(신청완료/선정/반려) 렌더링
```

### 8. 광고주 체험단 관리
```
Input: 체험단명, 모집기간, 모집인원, 제공혜택, 매장정보, 미션
       ↓
DB Write: campaigns (advertiser_id, title, recruitment_start_date, recruitment_end_date,
                     recruitment_count, benefits, mission, store_info, status='recruiting')
       ↓
Output: 내가 등록한 체험단 목록 갱신
```

### 9. 광고주 체험단 상세 & 모집 관리
```
Input: 모집종료 버튼 클릭
       ↓
DB Update: campaigns SET status = 'closed' WHERE id = :campaign_id
       ↓
DB Read: applications WHERE campaign_id = :campaign_id
       ↓
Input: 체험단 선정 (선정 인원 선택)
       ↓
DB Update: applications SET status = 'selected' WHERE id IN (:selected_ids)
           applications SET status = 'rejected' WHERE id NOT IN (:selected_ids)
           campaigns SET status = 'completed' WHERE id = :campaign_id
       ↓
Output: 선정 결과 반영, 인플루언서 상태 업데이트
```

---

## PostgreSQL 데이터베이스 스키마

### 1. 사용자 & 인증

#### users
사용자 기본 정보 (Supabase Auth 연동)

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL,  -- Supabase Auth ID
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('influencer', 'advertiser')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_role ON users(role);
```

#### user_agreements
약관 동의 이력

```sql
CREATE TABLE user_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agreement_type VARCHAR(50) NOT NULL,  -- 'terms', 'privacy', 'marketing'
  agreed BOOLEAN NOT NULL DEFAULT FALSE,
  agreed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_agreements_user_id ON user_agreements(user_id);
```

---

### 2. 인플루언서 프로필

#### influencer_profiles
인플루언서 기본 프로필

```sql
CREATE TABLE influencer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  birth_date DATE NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_influencer_profiles_user_id ON influencer_profiles(user_id);
```

#### influencer_channels
인플루언서 SNS 채널 정보

```sql
CREATE TABLE influencer_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES influencer_profiles(id) ON DELETE CASCADE,
  channel_type VARCHAR(50) NOT NULL,  -- 'naver', 'youtube', 'instagram', 'threads'
  channel_name VARCHAR(255) NOT NULL,
  channel_url TEXT NOT NULL,
  verification_status VARCHAR(20) DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'success', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_influencer_channels_influencer_id ON influencer_channels(influencer_id);
CREATE INDEX idx_influencer_channels_verification_status ON influencer_channels(verification_status);
```

---

### 3. 광고주 프로필

#### advertiser_profiles
광고주 기본 프로필

```sql
CREATE TABLE advertiser_profiles (
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

CREATE INDEX idx_advertiser_profiles_user_id ON advertiser_profiles(user_id);
CREATE UNIQUE INDEX idx_advertiser_profiles_business_reg_num
  ON advertiser_profiles(business_registration_number);
```

---

### 4. 체험단 (캠페인)

#### campaigns
체험단 모집 정보

```sql
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES advertiser_profiles(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  benefits TEXT NOT NULL,           -- 제공 혜택
  mission TEXT NOT NULL,             -- 미션
  store_info TEXT NOT NULL,          -- 매장 정보
  recruitment_count INTEGER NOT NULL CHECK (recruitment_count > 0),  -- 모집 인원
  recruitment_start_date DATE NOT NULL,
  recruitment_end_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'recruiting'
    CHECK (status IN ('recruiting', 'closed', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_recruitment_period
    CHECK (recruitment_end_date >= recruitment_start_date)
);

CREATE INDEX idx_campaigns_advertiser_id ON campaigns(advertiser_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at DESC);
CREATE INDEX idx_campaigns_recruitment_dates
  ON campaigns(recruitment_start_date, recruitment_end_date);
```

---

### 5. 체험단 지원

#### applications
체험단 지원 내역

```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,                      -- 각오 한마디
  visit_date DATE NOT NULL,          -- 방문 예정일자
  status VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending', 'selected', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_application UNIQUE(campaign_id, user_id)  -- 중복 지원 방지
);

CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_campaign_id ON applications(campaign_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_user_status ON applications(user_id, status);
```

---

## 전체 스키마 생성 SQL

```sql
-- ============================================================
-- 1. 사용자 & 인증
-- ============================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('influencer', 'advertiser')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_role ON users(role);

CREATE TABLE user_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agreement_type VARCHAR(50) NOT NULL,
  agreed BOOLEAN NOT NULL DEFAULT FALSE,
  agreed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_agreements_user_id ON user_agreements(user_id);

-- ============================================================
-- 2. 인플루언서 프로필
-- ============================================================

CREATE TABLE influencer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  birth_date DATE NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_influencer_profiles_user_id ON influencer_profiles(user_id);

CREATE TABLE influencer_channels (
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

CREATE INDEX idx_influencer_channels_influencer_id ON influencer_channels(influencer_id);
CREATE INDEX idx_influencer_channels_verification_status ON influencer_channels(verification_status);

-- ============================================================
-- 3. 광고주 프로필
-- ============================================================

CREATE TABLE advertiser_profiles (
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

CREATE INDEX idx_advertiser_profiles_user_id ON advertiser_profiles(user_id);
CREATE UNIQUE INDEX idx_advertiser_profiles_business_reg_num
  ON advertiser_profiles(business_registration_number);

-- ============================================================
-- 4. 체험단 (캠페인)
-- ============================================================

CREATE TABLE campaigns (
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

CREATE INDEX idx_campaigns_advertiser_id ON campaigns(advertiser_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at DESC);
CREATE INDEX idx_campaigns_recruitment_dates
  ON campaigns(recruitment_start_date, recruitment_end_date);

-- ============================================================
-- 5. 체험단 지원
-- ============================================================

CREATE TABLE applications (
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

CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_campaign_id ON applications(campaign_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_user_status ON applications(user_id, status);
```

---

## ERD 관계

```
users (1) ──< (1) influencer_profiles (1) ──< (*) influencer_channels
  │
  └──< (1) advertiser_profiles (1) ──< (*) campaigns (1) ──< (*) applications
  │
  └──< (*) user_agreements
  │
  └──< (*) applications
```

---

## 주요 제약 조건 및 설계 원칙

1. **중복 방지**
   - `applications`: `(campaign_id, user_id)` UNIQUE 제약으로 중복 지원 방지
   - `advertiser_profiles`: `business_registration_number` UNIQUE 제약으로 중복 사업자 방지

2. **데이터 무결성**
   - 모든 외래키에 `ON DELETE CASCADE` 적용으로 일관성 보장
   - `CHECK` 제약으로 상태값 및 비즈니스 룰 검증

3. **성능 최적화**
   - 자주 조회되는 컬럼에 인덱스 설정 (status, created_at, user_id 등)
   - 복합 인덱스로 필터링 쿼리 최적화

4. **확장성**
   - UUID 사용으로 분산 환경 대비
   - TIMESTAMPTZ로 시간대 정보 보존
   - TEXT 타입으로 긴 내용 저장 가능

5. **최소 스펙 준수**
   - 유저플로우에 명시된 데이터만 포함
   - 불필요한 메타데이터 제외 (조회수, 좋아요 등)
