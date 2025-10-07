## 데이터 플로우(최소 스펙)

- 회원가입(역할선택 포함)
  - 입력: 이름, 휴대폰번호, 이메일, 약관동의, 역할(광고주/인플루언서), 인증방식
  - 처리: Supabase Auth 계정 생성 → `users`에 기본 레코드 생성 → `terms_agreements`에 동의 이력 기록

- 인플루언서 정보 등록
  - 입력: 생년월일, SNS 채널(유형/이름/URL)
  - 처리: `influencer_profiles` 생성/수정 → `influencer_channels` 생성/수정(검증상태 초기값 pending)

- 광고주 정보 등록
  - 입력: 업체명, 위치, 카테고리, 사업자등록번호
  - 처리: `advertiser_profiles` 생성/수정(사업자등록번호 중복 가드)

- 홈/체험단 목록 탐색
  - 처리: `campaigns` where status='recruiting' 조회(페이징/정렬)

- 체험단 상세
  - 처리: `campaigns` 상세 조회, 지원 가드(인플루언서 프로필 완료 여부)

- 체험단 지원
  - 입력: 각오 한마디, 방문 예정일자
  - 처리: `applications` 삽입(중복 방지), 모집기간 가드

- 내 지원 목록(인플루언서)
  - 처리: `applications` where influencer_id=본인 프로필 조회(상태 필터)

- 광고주 체험단 관리/모집/선정
  - 처리: `campaigns` CRUD(광고주 소유), status 전환(recruiting→recruitment_closed→selection_completed), 지원자 조회 및 선정 반영

---

## 데이터베이스 스키마(PostgreSQL)

> 유저플로우에 명시된 데이터만 포함하는 최소 스펙이며, 현재 마이그레이션(0002_)에 맞춘 실제 컬럼명을 기준으로 기술합니다.

- users
  - id UUID PK, auth_user_id(UUID, unique), name, phone, email(unique), role('advertiser'|'influencer'), created_at, updated_at
  - 용도: 회원 기본정보 및 역할, Supabase Auth 연계 키(auth_user_id)

- terms_agreements
  - id UUID PK, user_id FK(users.id), terms_version, agreed_at
  - 용도: 약관 동의 이력

- influencer_profiles
  - id UUID PK, user_id FK(users.id, unique), birth_date, is_profile_complete, created_at, updated_at
  - 용도: 인플루언서 기본 정보(생년월일/완료여부)

- influencer_channels
  - id UUID PK, influencer_id FK(influencer_profiles.id), channel_type(naver|youtube|instagram|threads), channel_name, channel_url, verification_status(pending|verified|failed), created_at, updated_at
  - 제약: (권장) (influencer_id, channel_type, channel_url) 유니크 → 동일 채널 중복 방지

- advertiser_profiles
  - id UUID PK, user_id FK(users.id, unique), company_name, location, category, business_registration_number(unique), is_profile_complete, created_at, updated_at
  - 용도: 광고주 업체/사업자 정보

- campaigns
  - id UUID PK, advertiser_id FK(advertiser_profiles.id), title, description, recruitment_start_date, recruitment_end_date, max_participants, benefits, mission, store_info, status(recruiting|recruitment_closed|selection_completed), created_at, updated_at
  - 용도: 체험단(모집/상세) 정보, 목록/상세/모집관리

- applications
  - id UUID PK, campaign_id FK(campaigns.id), influencer_id FK(influencer_profiles.id), motivation, planned_visit_date, status(applied|selected|rejected), applied_at, updated_at
  - 제약: UNIQUE(campaign_id, influencer_id) → 중복 지원 방지

### 인덱스(핵심)
- users(role), campaigns(status, recruitment_start_date, recruitment_end_date), applications(campaign_id, influencer_id, status)

### 트리거
- updated_at 자동 갱신 트리거(모든 updated_at 보유 테이블)

---

## 비고
- 스키마는 `/supabase/migrations/0002_create_blog_campaign_tables.sql` 기준이며, 중복 채널 방지용 유니크 제약과 일부 인덱스는 별도 마이그레이션으로 보강합니다(아래 0004_ 참조).


