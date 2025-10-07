## 최종 단순화 본(Over-Engineering 제거)

- influencer-profile-form — `src/features/profiles/presentation/components/InfluencerProfileForm.tsx`
  - 단일 폼(생년월일/채널 1~N 추가·편집·삭제), 제출 시 한 번에 저장.
- useInfluencerProfileMutation — `src/features/profiles/presentation/hooks/useInfluencerProfileMutation.ts`
  - mutation 1개: POST /profiles/influencer (채널 배열 포함), 성공 시 완료 토스트.
- profiles.api — `src/features/profiles/interface/http/profiles.api.ts`
  - axios 래퍼: saveInfluencerProfile(payload).
- influencer.route — `src/features/profiles/interface/backend/route.ts`
  - Hono: POST /profiles/influencer (zod 인라인, 서비스 1개 호출).
- save-influencer-profile.service — `src/features/profiles/application/save-influencer-profile.ts`
  - 로직: upsert profile → replace channels(트랜잭션 없이 순차, 실패 시 에러 반환).
- profile.repo.supabase / channel.repo.supabase — `src/features/profiles/infrastructure/*`
  - 단순 insert/update/delete 구현.

```mermaid
flowchart LR
  UI[InfluencerProfileForm]-->Hook[useInfluencerProfileMutation]-->Api[profiles.api]
  Api-->Route[influencer.route]-->Svc[save-influencer-profile.service]
  Svc-->ProfRepo[profile.repo.supabase]
  Svc-->ChanRepo[channel.repo.supabase]
```

QA / 테스트
- QA: 미성년/URL오류/중복 채널/성공 4케이스.
- 테스트: service happy path, URL 중복 시 409 매핑, 생년월 규칙(>=18) 실패.
## 개요(Modules Overview)

- influencer-profile-ui — `src/features/profiles/presentation/components/InfluencerProfileForm.tsx`
  - 생년월일/채널(유형/이름/URL) 입력 폼, 로컬 검증 및 제출.
- useInfluencerProfile — `src/features/profiles/presentation/hooks/useInfluencerProfile.ts`
  - React Query mutation/queries: 프로필 저장, 채널 CRUD.
- profiles-dto — `src/features/profiles/interface/http/dto.ts`
  - 요청/응답 DTO, 에러 페이로드 타입.
- profiles-schema — `src/features/profiles/interface/backend/schema.ts`
  - zod 스키마 정의(프로필/채널 저장 요청/응답).
- profiles-route — `src/features/profiles/interface/backend/route.ts`
  - POST /profiles/influencer, POST/PUT/DELETE /profiles/influencer/channels.
- save-influencer-profile-uc — `src/features/profiles/application/use-cases/save-influencer-profile.ts`
  - 프로필 upsert + is_profile_complete 갱신.
- upsert-channel-uc — `src/features/profiles/application/use-cases/upsert-influencer-channel.ts`
  - 채널 생성/수정(verification_status=pending), 중복 가드.
- ports — `src/features/profiles/application/ports/{influencer-profile-repo.port.ts,influencer-channel-repo.port.ts}`
  - 저장소 추상화.
- domain — `src/features/profiles/domain/{entities,value-objects,services}`
  - entity: influencerProfile, influencerChannel; VO: birthDate, url; service: age policy(>=18).
- infra — `src/features/profiles/infrastructure/repositories/{influencer-profile.repository.supabase.ts,influencer-channel.repository.supabase.ts}`
  - Supabase 쿼리 구현.

## Diagram (mermaid)

```mermaid
flowchart LR
  subgraph Presentation
    UI[InfluencerProfileForm.tsx]
    Hook[useInfluencerProfile.ts]
  end
  subgraph Interface
    DTO[dto.ts]
    Schema[schema.ts]
    Route[route.ts]
  end
  subgraph Application
    SaveUC[save-influencer-profile.ts]
    ChannelUC[upsert-influencer-channel.ts]
    Ports[ports/*]
  end
  subgraph Domain
    Entity[profile/channel]
    VO[birthDate,url]
    Svc[age policy]
  end
  subgraph Infrastructure
    ProfRepo[influencer-profile.repository.supabase]
    ChRepo[influencer-channel.repository.supabase]
  end
  UI-->Hook-->Route-->Schema
  Route-->SaveUC
  Route-->ChannelUC
  SaveUC-->Ports
  ChannelUC-->Ports
  Ports-->ProfRepo
  Ports-->ChRepo
  SaveUC-->Entity
  SaveUC-->Svc
  ChannelUC-->VO
```

## Implementation Plan

### Presentation (QA)
- 필수 입력 미기재 시 제출 비활성/인라인 에러 노출.
- URL 형식 오류 시 경고, 저장 시 서버 재검증 실패 메시지 표시.
- 만 18세 미만 입력 시 제출 불가 메시지.
- 채널 추가/편집/삭제 후 목록 즉시 동기화.

### Interface
- dto.ts: SaveInfluencerProfileRequest/Response, UpsertChannelRequest/Response.
- schema.ts: zod로 최소 필드 검증, 에러코드 매핑(COMMON_ERROR_CODES).
- route.ts: POST /profiles/influencer, POST/PUT/DELETE /profiles/influencer/channels.

### Application (Unit Tests)
- save-influencer-profile.spec: 생년월일 → age policy 검사, upsert 성공/실패, 완료상태 갱신.
- upsert-influencer-channel.spec: 중복(유형+URL) 가드, status=pending 설정.

### Domain
- birthDate.vo: 나이 계산, 정책(>=18) 체크.
- url.vo: URL 파싱/정규화.

### Infrastructure
- profile repo: upsert by user_id, is_profile_complete 갱신.
- channel repo: insert/update, unique(influencer_id, channel_type, channel_url) 존중.

# 인플루언서 정보 등록 모듈화 설계

## 개요

### 공유 모듈 (Shared Modules)

#### 1. 프로필 관리 시스템 (`src/features/profiles/`)
- **위치**: `src/features/profiles/`
- **설명**: 인플루언서/광고주 프로필 등록 및 관리
- **구현 상태**: ✅ 완료
- **주요 컴포넌트**:
  - `backend/route.ts` - 프로필 API 라우터
  - `backend/service.ts` - 프로필 비즈니스 로직
  - `backend/schema.ts` - 프로필 스키마 정의
  - `backend/error.ts` - 프로필 에러 코드

#### 2. 검증 시스템 (`src/lib/validation/`)
- **위치**: `src/lib/validation/`
- **설명**: Zod 기반 스키마 검증, 나이 정책, URL 검증
- **구현 상태**: ✅ 완료
- **주요 기능**:
  - `validateAgePolicy()` - 만 18세 이상 검증
  - `validateUrl()` - URL 형식 검증
  - `influencerProfileSchema` - 인플루언서 프로필 스키마

#### 3. 인증 시스템 (`src/features/auth/`)
- **위치**: `src/features/auth/`
- **설명**: 사용자 인증 및 권한 관리
- **구현 상태**: ✅ 완료
- **주요 기능**:
  - 사용자 역할 검증 (influencer)
  - 인증 상태 관리

### 도메인별 모듈 (Domain Modules)

#### 1. 인플루언서 프로필 페이지 (`src/app/(protected)/profiles/influencer/`)
- **위치**: `src/app/(protected)/profiles/influencer/page.tsx`
- **설명**: 인플루언서 정보 등록 UI
- **구현 상태**: ✅ 완료
- **주요 기능**:
  - 생년월일 입력 폼
  - SNS 채널 추가/편집/삭제
  - 실시간 유효성 검사
  - 프로필 저장/임시저장

#### 2. 채널 관리 컴포넌트
- **위치**: `src/app/(protected)/profiles/influencer/page.tsx` 내부
- **설명**: SNS 채널 동적 관리
- **구현 상태**: ✅ 완료
- **주요 기능**:
  - 채널 추가/삭제
  - 채널 유형 선택 (naver, youtube, instagram, threads)
  - URL 유효성 검사
  - 중복 채널 방지

### 공통 유틸리티 (Shared Utilities)

#### 1. UI 컴포넌트 (`src/components/ui/`)
- **위치**: `src/components/ui/`
- **설명**: shadcn-ui 기반 재사용 가능한 UI 컴포넌트
- **구현 상태**: ✅ 완료
- **사용 컴포넌트**:
  - `Card` - 프로필 카드
  - `Button` - 액션 버튼
  - `Input` - 입력 필드
  - `Label` - 라벨
  - `Select` - 드롭다운
  - `Badge` - 상태 표시

#### 2. HTTP 클라이언트 (`src/lib/remote/`)
- **위치**: `src/lib/remote/`
- **설명**: API 통신을 위한 HTTP 클라이언트
- **구현 상태**: ✅ 완료

#### 3. 상태 관리 (`src/features/auth/context/`)
- **위치**: `src/features/auth/context/`
- **설명**: 사용자 상태 및 권한 관리
- **구현 상태**: ✅ 완료

## Diagram

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Influencer Profile Page] --> B[Channel Management]
        A --> C[Form Validation]
        A --> D[User Context]
        
        B --> E[Channel CRUD]
        C --> F[Real-time Validation]
        D --> G[Auth State]
        
        E --> H[API Client]
        F --> H
        G --> H
    end
    
    subgraph "Backend Layer"
        H --> I[Profile Routes]
        I --> J[Profile Service]
        J --> K[Database Operations]
        
        K --> L[(influencer_profiles)]
        K --> M[(influencer_channels)]
        K --> N[(users)]
    end
    
    subgraph "Validation Layer"
        O[Schema Validation]
        P[Age Policy Check]
        Q[URL Validation]
        
        O --> J
        P --> J
        Q --> J
    end
    
    subgraph "Shared Modules"
        R[Error Handling]
        S[Response Utils]
        T[Auth Middleware]
        
        R --> I
        S --> I
        T --> I
    end
```

## Implementation Plan

### Phase 1: 백엔드 API (이미 완료)

#### 1.1 프로필 API (`src/features/profiles/backend/`)
- **구현 상태**: ✅ 완료
- **주요 엔드포인트**:
  - `POST /api/profiles/influencer` - 인플루언서 프로필 등록
  - `GET /api/profiles/me` - 내 프로필 조회
  - `PUT /api/profiles/influencer` - 인플루언서 프로필 수정
- **Unit Tests**:
  - [ ] 프로필 등록 성공 케이스
  - [ ] 미성년자 가입 에러 케이스 (만 18세 미만)
  - [ ] 중복 프로필 등록 에러 케이스
  - [ ] 유효하지 않은 URL 형식 에러 케이스
  - [ ] 권한 없는 사용자 에러 케이스 (advertiser 접근)
  - [ ] 채널 최소 개수 검증 (1개 이상)
  - [ ] 중복 채널 등록 에러 케이스

#### 1.2 검증 시스템 (`src/lib/validation/`)
- **구현 상태**: ✅ 완료
- **주요 검증 함수**:
  - `validateAgePolicy()` - 나이 정책 검증
  - `validateUrl()` - URL 형식 검증
  - `influencerProfileSchema` - 프로필 스키마
- **Unit Tests**:
  - [ ] 나이 정책 검증 성공/실패 케이스
  - [ ] URL 형식 검증 성공/실패 케이스
  - [ ] 채널 배열 최소 개수 검증
  - [ ] 채널 유형 enum 검증

### Phase 2: 프론트엔드 컴포넌트 (이미 완료)

#### 2.1 인플루언서 프로필 페이지
- **구현 상태**: ✅ 완료
- **주요 기능**:
  - 생년월일 입력 (날짜 선택기)
  - SNS 채널 동적 추가/삭제
  - 실시간 유효성 검사
  - 프로필 저장/임시저장
- **QA Sheet**:
  - [ ] 생년월일 입력 및 나이 검증
  - [ ] 채널 추가/삭제 기능
  - [ ] 채널 유형 선택 (naver, youtube, instagram, threads)
  - [ ] URL 유효성 검사 (실시간)
  - [ ] 중복 채널 방지
  - [ ] 최소 1개 채널 등록 필수
  - [ ] 프로필 저장 성공/실패 처리
  - [ ] 에러 메시지 표시
  - [ ] 로딩 상태 표시

#### 2.2 채널 관리 컴포넌트
- **구현 상태**: ✅ 완료
- **주요 기능**:
  - 채널 추가 버튼
  - 채널 삭제 버튼
  - 채널 유형 드롭다운
  - URL 입력 필드
- **QA Sheet**:
  - [ ] 채널 추가 시 폼 초기화
  - [ ] 채널 삭제 시 확인 없이 즉시 삭제
  - [ ] 채널 유형별 아이콘 표시
  - [ ] URL 입력 시 실시간 검증
  - [ ] 채널명 중복 검사
  - [ ] 최대 채널 개수 제한 (선택사항)

### Phase 3: 통합 테스트 및 최적화

#### 3.1 E2E 테스트 시나리오
- **인플루언서 회원가입 → 프로필 등록 → 체험단 지원** 플로우
- **프로필 수정 → 채널 추가/삭제** 플로우
- **에러 상황 처리** (미성년자, 중복 채널, 잘못된 URL)

#### 3.2 성능 최적화
- React Query를 통한 프로필 데이터 캐싱
- 폼 상태 최적화 (불필요한 리렌더링 방지)
- 이미지 최적화 (프로필 사진 업로드 시)

#### 3.3 사용자 경험 개선
- 자동 저장 기능 (임시저장)
- 진행률 표시 (프로필 완성도)
- 도움말 툴팁 (채널 등록 가이드)

### Phase 4: 비동기 검증 시스템 (향후 확장)

#### 4.1 채널 검증 워커
- **목적**: 등록된 SNS 채널의 실제 존재 여부 검증
- **구현 계획**:
  - 백그라운드 작업 큐 시스템
  - 각 플랫폼별 API 연동
  - 검증 결과 데이터베이스 업데이트

#### 4.2 검증 상태 관리
- **검증 중**: 채널 검증 진행 중
- **검증 완료**: 채널이 실제로 존재함
- **검증 실패**: 채널이 존재하지 않거나 접근 불가

## 결론

인플루언서 정보 등록 기능이 이미 완전히 구현되어 있으며, 유스케이스 문서의 모든 요구사항을 충족합니다.

**현재 상태**: ✅ 구현 완료
- ✅ 생년월일 입력 및 나이 검증
- ✅ SNS 채널 동적 관리
- ✅ 실시간 유효성 검사
- ✅ 프로필 저장/수정
- ✅ 에러 처리 및 사용자 피드백

**다음 단계**: 실제 데이터베이스 연동 테스트 및 사용자 시나리오 검증

## 단순화된 최종 구조

### 1. 핵심 기능만 유지
- 회원가입/로그인 (기본 인증)
- 체험단 목록/상세 (인플루언서용)
- 체험단 관리 (광고주용)
- 지원 관리

### 2. 단순화된 파일 구조
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (protected)/
│   │   ├── home/page.tsx (체험단 목록)
│   │   ├── campaigns/
│   │   │   ├── [id]/page.tsx (체험단 상세)
│   │   │   └── [id]/apply/page.tsx (지원하기)
│   │   ├── manage/page.tsx (광고주 체험단 관리)
│   │   └── applications/page.tsx (내 지원 목록)
│   └── api/
│       └── [[...hono]]/route.ts
├── components/
│   └── ui/ (shadcn-ui 컴포넌트들)
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── types.ts
│   └── utils.ts
└── backend/
    ├── hono/
    │   ├── app.ts
    │   └── context.ts
    ├── middleware/
    │   ├── error.ts
    │   └── supabase.ts
    └── http/
        └── response.ts
```

### 3. 단순화된 API 구조
```
/api/
├── auth/
│   ├── login
│   └── signup
├── campaigns/
│   ├── GET / (목록)
│   ├── GET /:id (상세)
│   ├── POST / (생성)
│   └── PUT /:id/close (모집종료)
├── applications/
│   ├── POST / (지원)
│   └── GET /my (내 지원목록)
└── profiles/
    ├── POST /influencer
    └── POST /advertiser
```

### 4. 핵심 기능 구현

#### A. 인증 시스템 (단순화)
```typescript
// src/lib/auth.ts
export const auth = {
  signup: async (email: string, password: string, role: 'influencer' | 'advertiser') => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    return data
  },
  
  login: async (email: string, password: string) => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    return data
  }
}
```

#### B. 체험단 관리 (단순화)
```typescript
// src/lib/campaigns.ts
export const campaigns = {
  getList: async (filters?: { status?: string, search?: string }) => {
    const supabase = createClient()
    let query = supabase.from('campaigns').select('*')
    
    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.search) query = query.ilike('title', `%${filters.search}%`)
    
    const { data, error } = await query
    if (error) throw error
    return data
  },
  
  getById: async (id: string) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },
  
  create: async (campaignData: any) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('campaigns')
      .insert(campaignData)
      .select()
      .single()
    if (error) throw error
    return data
  }
}
```

#### C. 지원 관리 (단순화)
```typescript
// src/lib/applications.ts
export const applications = {
  apply: async (campaignId: string, applicationData: any) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('applications')
      .insert({
        campaign_id: campaignId,
        ...applicationData
      })
      .select()
      .single()
    if (error) throw error
    return data
  },
  
  getMyApplications: async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        campaigns (
          title,
          status
        )
      `)
      .eq('influencer_id', user?.id)
    if (error) throw error
    return data
  }
}
```

### 5. 단순화된 페이지 구조

#### A. 홈페이지 (체험단 목록)
```typescript
// src/app/(protected)/home/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { campaigns } from '@/lib/campaigns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function HomePage() {
  const [campaignsList, setCampaignsList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const data = await campaigns.getList({ status: 'recruiting' })
        setCampaignsList(data)
      } catch (error) {
        console.error('Failed to load campaigns:', error)
      } finally {
        setLoading(false)
      }
    }
    loadCampaigns()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">체험단 목록</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaignsList.map((campaign) => (
          <Card key={campaign.id}>
            <CardHeader>
              <CardTitle>{campaign.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{campaign.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {campaign.max_participants}명 모집
                </span>
                <Link href={`/campaigns/${campaign.id}`}>
                  <Button>자세히 보기</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
```

#### B. 체험단 상세 페이지
```typescript
// src/app/(protected)/campaigns/[id]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { campaigns } from '@/lib/campaigns'
import { applications } from '@/lib/applications'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function CampaignDetailPage({ params }: { params: { id: string } }) {
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCampaign = async () => {
      try {
        const data = await campaigns.getById(params.id)
        setCampaign(data)
      } catch (error) {
        console.error('Failed to load campaign:', error)
      } finally {
        setLoading(false)
      }
    }
    loadCampaign()
  }, [params.id])

  const handleApply = async () => {
    try {
      await applications.apply(params.id, {
        motivation: '체험단에 참여하고 싶습니다!',
        planned_visit_date: new Date().toISOString().split('T')[0]
      })
      alert('지원이 완료되었습니다!')
    } catch (error) {
      console.error('Failed to apply:', error)
      alert('지원에 실패했습니다.')
    }
  }

  if (loading) return <div>Loading...</div>
  if (!campaign) return <div>Campaign not found</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>{campaign.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>{campaign.description}</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold">모집 기간</h3>
                <p>{new Date(campaign.recruitment_start_date).toLocaleDateString()} ~ {new Date(campaign.recruitment_end_date).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="font-semibold">모집 인원</h3>
                <p>{campaign.max_participants}명</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold">제공 혜택</h3>
              <p>{campaign.benefits}</p>
            </div>
            <div>
              <h3 className="font-semibold">미션</h3>
              <p>{campaign.mission}</p>
            </div>
            {campaign.status === 'recruiting' && (
              <Button onClick={handleApply} className="w-full">
                지원하기
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 6. 단순화된 백엔드 (Hono)

```typescript
// src/backend/hono/app.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createClient } from '@supabase/supabase-js'

const app = new Hono()

app.use('*', cors())

// 체험단 목록
app.get('/campaigns', async (c) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('status', 'recruiting')
  
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data })
})

// 체험단 상세
app.get('/campaigns/:id', async (c) => {
  const id = c.req.param('id')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data })
})

// 체험단 생성
app.post('/campaigns', async (c) => {
  const body = await c.req.json()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  const { data, error } = await supabase
    .from('campaigns')
    .insert(body)
    .select()
    .single()
  
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data })
})

export default app
```

### 7. 핵심 데이터베이스 테이블 (최소한)

```sql
-- 사용자 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('advertiser', 'influencer')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 체험단 테이블
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  benefits TEXT NOT NULL,
  mission TEXT NOT NULL,
  max_participants INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'recruiting' CHECK (status IN ('recruiting', 'closed', 'completed')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 지원 테이블
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  influencer_id UUID NOT NULL REFERENCES users(id),
  motivation TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'applied' CHECK (status IN ('applied', 'selected', 'rejected')),
  applied_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(campaign_id, influencer_id)
);
```

### 8. 최종 구현 순서

1. **기본 인증 시스템** (회원가입/로그인)
2. **체험단 목록/상세 페이지** (인플루언서용)
3. **체험단 관리 페이지** (광고주용)
4. **지원 기능** (지원하기/지원목록)
5. **기본 스타일링** (Tailwind CSS)

이렇게 단순화하면 핵심 기능만 남기고 복잡한 모듈 구조를 제거할 수 있습니다. 각 기능은 독립적으로 작동하며, 필요에 따라 점진적으로 확장할 수 있습니다.
