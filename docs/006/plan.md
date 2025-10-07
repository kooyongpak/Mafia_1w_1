## 최종 단순화 본(Over-Engineering 제거)

- application-form — `src/features/applications/presentation/components/ApplicationForm.tsx`
  - 각오/방문일 단일 폼, 제출/로딩/중복 방지.
- useCreateApplicationMutation — `src/features/applications/presentation/hooks/useCreateApplicationMutation.ts`
  - mutation 1개: POST /applications
- applications.api — `src/features/applications/interface/http/applications.api.ts`
  - axios 래퍼.
- applications.route(create) — `src/features/applications/interface/backend/route.ts`
  - Hono: POST /applications (기간/중복 가드만 처리)
- create-application.service — `src/features/applications/application/create-application.ts`
  - 최소 로직: canApply 체크 → insert
- repositories — `src/features/applications/infrastructure/repositories/*`
  - applications/campaign/profile 조회/삽입 최소 구현

```mermaid
flowchart LR
  UI[ApplicationForm]-->Hook[useCreateApplicationMutation]-->Api[applications.api]
  Api-->Route[applications.route(create)]-->Svc[create-application.service]-->Repos[repositories]
```

QA / 테스트
- QA: 중복/기간 외/성공 3케이스.
- 테스트: service 성공/중복/기간 외 분기.
## 개요(Modules Overview)

- application-form-ui — `src/features/applications/presentation/components/ApplicationForm.tsx`
  - 각오/방문예정일 입력 폼, 제출/중복 제출 방지, 로컬 검증.
- useCreateApplication — `src/features/applications/presentation/hooks/useCreateApplication.ts`
  - React Query mutation 훅: 지원 생성, 성공 시 내 지원 목록 무효화.
- applications-dto — `src/features/applications/interface/http/dto.ts`
  - CreateApplicationRequest/Response, 에러 페이로드 정의.
- applications-schema — `src/features/applications/interface/backend/schema.ts`
  - zod 스키마: payload 검증(각오/방문일/캠페인id), 응답 스키마/에러맵.
- applications-route — `src/features/applications/interface/backend/route.ts`
  - POST /applications (중복/기간 가드 포함 에러 처리 표준화).
- create-application-usecase — `src/features/applications/application/use-cases/create-application.ts`
  - 유즈케이스: 기간/상태/중복 가드 → insert → 결과 반환.
- ports — `src/features/applications/application/ports/{application-repository.port.ts,campaign-repository.port.ts,profile-repository.port.ts}`
  - applications/campaigns/profile 조회/삽입 Port.
- domain — `src/features/applications/domain/services/eligibility.service.ts`, `value-objects/planned-visit-date.ts`
  - 지원 가능 판단(기간/상태/프로필/중복), 방문일자 VO(미래 날짜 규칙).
- infra — `src/features/applications/infrastructure/repositories/{application.repository.supabase.ts,campaign.repository.supabase.ts,profile.repository.supabase.ts}`
  - Supabase 구현.

## Diagram (mermaid)

```mermaid
flowchart LR
  subgraph Presentation
    FormUI[ApplicationForm.tsx]
    Hook[useCreateApplication.ts]
  end

  subgraph Interface
    DTO[dto.ts]
    Schema[schema.ts]
    Route[route.ts]
  end

  subgraph Application
    UC[create-application.ts]
    Ports[Ports: app/campaign/profile]
  end

  subgraph Domain
    Elig[eligibility.service.ts]
    VO[planned-visit-date.vo.ts]
  end

  subgraph Infrastructure
    AppRepo[application.repository.supabase]
    CampRepo[campaign.repository.supabase]
    ProfRepo[profile.repository.supabase]
  end

  FormUI --> Hook
  Hook --> Route
  Route --> Schema
  Route --> UC
  UC --> Ports
  Ports --> AppRepo
  Ports --> CampRepo
  Ports --> ProfRepo
  UC --> Elig
  UC --> VO
```

## Implementation Plan

### Presentation (QA)
- 필수값(각오/방문일) 미입력 시 제출 비활성 및 인라인 에러.
- 방문일 과거 선택 시 경고(서버 재검증 실패도 메시지 반영).
- 제출 중 로딩, 중복 클릭 방지, 성공 후 토스트 및 내 지원 목록 무효화.

### Interface
- dto.ts: { campaignId, motivation, plannedVisitDate } 요청/응답 타입 정의.
- schema.ts: zod로 최소 검증, 에러코드(CONFLICT/VALIDATION_ERROR/INTERNAL_ERROR) 매핑.
- route.ts: POST /applications → usecase 호출 → respond(success|failure).

### Application (Unit Tests)
- create-application.spec.ts
  - 모집기간 밖/상태!=recruiting → can=false
  - 프로필 미완료 → can=false
  - 중복 지원 → CONFLICT
  - 성공 → row insert 및 반환 값 검증

### Domain
- eligibility.service.ts: (campaign.status/period, profile.complete, alreadyApplied) → { canApply, reasons }.
- planned-visit-date.vo.ts: 미래 날짜 검증, parse/format 제공.

### Infrastructure
- application.repository.supabase.ts: UNIQUE(campaign_id,influencer_id) 위반을 CONFLICT 매핑.
- campaign.repository.supabase.ts: id로 status/기간 조회.
- profile.repository.supabase.ts: influencer_profiles.is_profile_complete 조회.

### Shared/Guidelines
- 공통 응답/에러: `src/backend/http/response.ts`.
- Axios 호출: `@/lib/remote/api-client`.
- 레이어드 구조(AGENTS.md) 준수.

# 체험단 지원 모듈화 설계

## 개요

### 공유 모듈 (Shared Modules)

#### 1. 지원 관리 시스템 (`src/features/applications/`)
- **위치**: `src/features/applications/`
- **설명**: 체험단 지원 및 지원 상태 관리
- **구현 상태**: ✅ 완료
- **주요 컴포넌트**:
  - `backend/route.ts` - 지원 API 라우터
  - `backend/service.ts` - 지원 비즈니스 로직
  - `backend/schema.ts` - 지원 스키마 정의
  - `backend/error.ts` - 지원 에러 코드

#### 2. 인증 시스템 (`src/features/auth/`)
- **위치**: `src/features/auth/`
- **설명**: 사용자 인증 및 권한 관리
- **구현 상태**: ✅ 완료
- **주요 기능**:
  - 사용자 역할 검증 (influencer)
  - 인증 상태 관리
  - 현재 사용자 정보 조회

#### 3. 검증 시스템 (`src/lib/validation/`)
- **위치**: `src/lib/validation/`
- **설명**: Zod 기반 스키마 검증, 날짜 검증
- **구현 상태**: ✅ 완료
- **주요 기능**:
  - `applicationCreateSchema` - 지원 생성 스키마
  - `validateDateRange` - 날짜 범위 검증
  - `validateRequiredFields` - 필수 필드 검증

### 도메인별 모듈 (Domain Modules)

#### 1. 체험단 지원 페이지 (`src/app/(protected)/campaigns/[id]/apply/`)
- **위치**: `src/app/(protected)/campaigns/[id]/apply/page.tsx`
- **설명**: 체험단 지원 폼 UI
- **구현 상태**: ✅ 완료
- **주요 기능**:
  - 지원 정보 입력 폼
  - 유효성 검사
  - 지원 제출 처리
  - 성공/에러 피드백

#### 2. 지원 폼 컴포넌트
- **위치**: `src/app/(protected)/campaigns/[id]/apply/page.tsx` 내부
- **설명**: 지원 정보 입력 폼
- **구현 상태**: ✅ 완료
- **주요 기능**:
  - 각오 한마디 입력
  - 방문 예정일자 선택
  - 폼 유효성 검사
  - 제출 버튼

#### 3. 체험단 정보 표시 컴포넌트
- **위치**: `src/app/(protected)/campaigns/[id]/apply/page.tsx` 내부
- **설명**: 지원할 체험단 정보 표시
- **구현 상태**: ✅ 완료
- **주요 기능**:
  - 체험단 기본 정보 표시
  - 광고주 정보 표시
  - 모집 상태 표시

#### 4. 지원 상태 관리 컴포넌트
- **위치**: `src/app/(protected)/campaigns/[id]/apply/page.tsx` 내부
- **설명**: 지원 상태 및 피드백 관리
- **구현 상태**: ✅ 완료
- **주요 기능**:
  - 지원 성공/실패 처리
  - 에러 메시지 표시
  - 로딩 상태 관리

### 공통 유틸리티 (Shared Utilities)

#### 1. UI 컴포넌트 (`src/components/ui/`)
- **위치**: `src/components/ui/`
- **설명**: shadcn-ui 기반 재사용 가능한 UI 컴포넌트
- **구현 상태**: ✅ 완료
- **사용 컴포넌트**:
  - `Card` - 지원 폼 카드
  - `Button` - 제출 버튼
  - `Input` - 텍스트 입력
  - `Textarea` - 각오 한마디 입력
  - `Label` - 폼 라벨

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
        A[Apply Page] --> B[Application Form]
        A --> C[Campaign Info]
        A --> D[Status Management]
        A --> E[User Context]
        
        B --> F[Form Validation]
        C --> G[Campaign Display]
        D --> H[Success/Error Feedback]
        E --> I[Auth State]
        
        F --> J[API Client]
        G --> J
        H --> J
        I --> J
    end
    
    subgraph "Backend Layer"
        J --> K[Application Routes]
        K --> L[Application Service]
        L --> M[Database Operations]
        
        M --> N[(applications)]
        M --> O[(campaigns)]
        M --> P[(users)]
    end
    
    subgraph "Validation Layer"
        Q[Form Validation]
        R[Date Validation]
        S[Duplicate Check]
        
        Q --> L
        R --> L
        S --> L
    end
    
    subgraph "Shared Modules"
        T[Error Handling]
        U[Response Utils]
        V[Auth Middleware]
        
        T --> K
        U --> K
        V --> K
    end
```

## Implementation Plan

### Phase 1: 백엔드 API (이미 완료)

#### 1.1 지원 API (`src/features/applications/backend/`)
- **구현 상태**: ✅ 완료
- **주요 엔드포인트**:
  - `POST /api/applications` - 체험단 지원
  - `GET /api/applications/my` - 내 지원 목록 조회
- **Unit Tests**:
  - [ ] 지원 생성 성공 케이스
  - [ ] 중복 지원 방지 검증
  - [ ] 모집 기간 체크 검증
  - [ ] 권한 없는 사용자 지원 시도 케이스
  - [ ] 유효하지 않은 날짜 에러 케이스
  - [ ] 빈 각오 한마디 에러 케이스
  - [ ] 데이터베이스 연결 오류 케이스

#### 1.2 검증 시스템 (`src/lib/validation/`)
- **구현 상태**: ✅ 완료
- **주요 검증 함수**:
  - `applicationCreateSchema` - 지원 생성 검증
  - `validateDateRange` - 날짜 범위 검증
  - `validateRequiredFields` - 필수 필드 검증
- **Unit Tests**:
  - [ ] 지원 스키마 검증 성공/실패 케이스
  - [ ] 날짜 검증 성공/실패 케이스
  - [ ] 필수 필드 검증 성공/실패 케이스
  - [ ] 각오 한마디 길이 검증
  - [ ] 방문 예정일 미래 날짜 검증

### Phase 2: 프론트엔드 컴포넌트 (이미 완료)

#### 2.1 체험단 지원 페이지
- **구현 상태**: ✅ 완료
- **주요 기능**:
  - 지원 정보 입력 폼
  - 유효성 검사
  - 지원 제출 처리
  - 성공/에러 피드백
- **QA Sheet**:
  - [ ] 각오 한마디 입력 필드 표시
  - [ ] 방문 예정일자 선택 필드 표시
  - [ ] 지원하기 버튼 표시
  - [ ] 폼 유효성 검사 동작
  - [ ] 지원 제출 시 로딩 상태 표시
  - [ ] 지원 성공 시 성공 메시지 표시
  - [ ] 지원 실패 시 에러 메시지 표시
  - [ ] 지원 완료 후 내 지원 목록으로 이동
  - [ ] 체험단 정보 정확한 표시
  - [ ] 반응형 디자인 확인

#### 2.2 지원 폼 컴포넌트
- **구현 상태**: ✅ 완료
- **주요 기능**:
  - 각오 한마디 입력
  - 방문 예정일자 선택
  - 폼 유효성 검사
  - 제출 버튼
- **QA Sheet**:
  - [ ] 각오 한마디 입력 필드 정상 동작
  - [ ] 방문 예정일자 선택 필드 정상 동작
  - [ ] 필수 필드 미입력 시 에러 메시지 표시
  - [ ] 각오 한마디 길이 제한 (500자) 동작
  - [ ] 방문 예정일 미래 날짜 검증
  - [ ] 폼 제출 시 유효성 검사 동작
  - [ ] 제출 버튼 클릭 시 로딩 상태 표시

#### 2.3 체험단 정보 표시 컴포넌트
- **구현 상태**: ✅ 완료
- **주요 기능**:
  - 체험단 기본 정보 표시
  - 광고주 정보 표시
  - 모집 상태 표시
- **QA Sheet**:
  - [ ] 체험단 제목 및 설명 표시
  - [ ] 광고주 회사명 및 위치 표시
  - [ ] 모집 기간 표시
  - [ ] 모집 상태 배지 표시
  - [ ] 최대 참여자 수 표시

#### 2.4 지원 상태 관리 컴포넌트
- **구현 상태**: ✅ 완료
- **주요 기능**:
  - 지원 성공/실패 처리
  - 에러 메시지 표시
  - 로딩 상태 관리
- **QA Sheet**:
  - [ ] 지원 성공 시 성공 메시지 표시
  - [ ] 지원 실패 시 에러 메시지 표시
  - [ ] 로딩 상태 표시
  - [ ] 지원 완료 후 페이지 이동
  - [ ] 에러 상황별 적절한 메시지 표시

### Phase 3: 통합 테스트 및 최적화

#### 3.1 E2E 테스트 시나리오
- **체험단 상세 → 지원 페이지 → 지원 제출 → 내 지원 목록** 플로우
- **중복 지원 시도 → 에러 메시지 표시** 플로우
- **모집 종료된 체험단 → 지원 시도 → 에러 메시지 표시** 플로우
- **유효하지 않은 입력 → 유효성 검사 → 에러 메시지 표시** 플로우

#### 3.2 성능 최적화
- React Query를 통한 지원 데이터 캐싱
- 폼 제출 시 중복 요청 방지
- 이미지 지연 로딩 (광고주 로고 등)

#### 3.3 사용자 경험 개선
- 로딩 스켈레톤 UI
- 에러 상태별 사용자 친화적 메시지
- 폼 자동 저장 (선택사항)
- 지원 완료 후 자동 리다이렉트

### Phase 4: 고급 기능 (향후 확장)

#### 4.1 지원 이력 관리
- **목적**: 사용자 지원 이력 추적 및 관리
- **구현 계획**:
  - 지원 이력 조회 기능
  - 지원 상태 변경 알림
  - 지원 통계 대시보드

#### 4.2 알림 시스템
- **목적**: 지원 결과 및 상태 변경 알림
- **구현 계획**:
  - 지원 완료 알림
  - 선정 결과 알림
  - 이메일/SMS 알림 (선택사항)

## 결론

체험단 지원 기능이 이미 완전히 구현되어 있으며, 유스케이스 문서의 모든 요구사항을 충족합니다.

**현재 상태**: ✅ 구현 완료
- ✅ 지원 정보 입력 폼
- ✅ 유효성 검사 (각오 한마디, 방문 예정일)
- ✅ 중복 지원 방지
- ✅ 모집 기간 체크
- ✅ 지원 정보 저장
- ✅ 성공/에러 피드백
- ✅ 내 지원 목록 업데이트

**다음 단계**: 실제 데이터베이스 연동 테스트 및 사용자 시나리오 검증

## 단순화된 최종 구조

### 1. 핵심 기능만 유지
- 체험단 지원 폼
- 유효성 검사
- 지원 제출 처리

### 2. 단순화된 파일 구조
```
src/
├── app/
│   └── (protected)/
│       └── campaigns/
│           └── [id]/
│               └── apply/
│                   └── page.tsx (지원 폼)
├── components/
│   └── ui/ (shadcn-ui 컴포넌트들)
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── types.ts
│   └── utils.ts
└── backend/
    └── hono/
        └── app.ts
```

### 3. 단순화된 API 구조
```
/api/
└── applications/
    └── POST / (지원 제출)
```

### 4. 핵심 기능 구현

#### A. 체험단 지원 페이지 (단순화)
```typescript
// src/app/(protected)/campaigns/[id]/apply/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'

export default function ApplyPage({ params }: { params: { id: string } }) {
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const [formData, setFormData] = useState({
    motivation: '',
    planned_visit_date: ''
  })
  
  const router = useRouter()

  useEffect(() => {
    const loadCampaign = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('campaigns')
          .select(`
            *,
            advertiser_profiles (
              company_name,
              location
            )
          `)
          .eq('id', params.id)
          .single()

        if (error) throw error
        setCampaign(data)
      } catch (error) {
        console.error('Failed to load campaign:', error)
        setError('체험단 정보를 불러올 수 없습니다.')
      } finally {
        setLoading(false)
      }
    }
    loadCampaign()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const supabase = createClient()
      
      // 현재 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('로그인이 필요합니다.')

      // 중복 지원 체크
      const { data: existingApplication } = await supabase
        .from('applications')
        .select('id')
        .eq('campaign_id', params.id)
        .eq('influencer_id', user.id)
        .single()

      if (existingApplication) {
        throw new Error('이미 지원한 체험단입니다.')
      }

      // 모집 기간 체크
      const today = new Date()
      const endDate = new Date(campaign.recruitment_end_date)
      if (today > endDate) {
        throw new Error('모집이 종료된 체험단입니다.')
      }

      // 지원 정보 저장
      const { error: insertError } = await supabase
        .from('applications')
        .insert({
          campaign_id: params.id,
          influencer_id: user.id,
          motivation: formData.motivation,
          planned_visit_date: formData.planned_visit_date,
          status: 'applied'
        })

      if (insertError) throw insertError

      setSuccess(true)
      setTimeout(() => {
        router.push('/applications')
      }, 2000)

    } catch (error) {
      console.error('Failed to apply:', error)
      setError(error.message || '지원에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!campaign) return <div>Campaign not found</div>
  if (success) return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="pt-6 text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-4">지원이 완료되었습니다!</h2>
          <p className="text-gray-600">내 지원 목록으로 이동합니다...</p>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 체험단 정보 */}
        <Card>
          <CardHeader>
            <CardTitle>{campaign.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">체험단 설명</h3>
                <p className="text-gray-700">{campaign.description}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">제공 혜택</h3>
                <p className="text-gray-700">{campaign.benefits}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">미션</h3>
                <p className="text-gray-700">{campaign.mission}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">모집 기간</h3>
                  <p className="text-gray-700">
                    {new Date(campaign.recruitment_start_date).toLocaleDateString()} ~ {' '}
                    {new Date(campaign.recruitment_end_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">모집 인원</h3>
                  <p className="text-gray-700">{campaign.max_participants}명</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 지원 폼 */}
        <Card>
          <CardHeader>
            <CardTitle>지원하기</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="motivation">각오 한마디 *</Label>
                <Textarea
                  id="motivation"
                  value={formData.motivation}
                  onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                  placeholder="체험단에 대한 각오를 적어주세요"
                  className="mt-2"
                  rows={4}
                  maxLength={500}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.motivation.length}/500자
                </p>
              </div>

              <div>
                <Label htmlFor="planned_visit_date">방문 예정일 *</Label>
                <Input
                  id="planned_visit_date"
                  type="date"
                  value={formData.planned_visit_date}
                  onChange={(e) => setFormData({ ...formData, planned_visit_date: e.target.value })}
                  className="mt-2"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={submitting || !formData.motivation || !formData.planned_visit_date}
              >
                {submitting ? '지원 중...' : '지원하기'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

#### B. 단순화된 백엔드 (Hono)

```typescript
// src/backend/hono/app.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createClient } from '@supabase/supabase-js'

const app = new Hono()

app.use('*', cors())

// 체험단 지원
app.post('/applications', async (c) => {
  const body = await c.req.json()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  // 현재 사용자 정보 가져오기
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  
  // 중복 지원 체크
  const { data: existingApplication } = await supabase
    .from('applications')
    .select('id')
    .eq('campaign_id', body.campaign_id)
    .eq('influencer_id', user.id)
    .single()
  
  if (existingApplication) {
    return c.json({ error: '이미 지원한 체험단입니다.' }, 400)
  }
  
  // 모집 기간 체크
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('recruitment_end_date, status')
    .eq('id', body.campaign_id)
    .single()
  
  if (campaign?.status !== 'recruiting') {
    return c.json({ error: '모집이 종료된 체험단입니다.' }, 400)
  }
  
  const today = new Date()
  const endDate = new Date(campaign.recruitment_end_date)
  if (today > endDate) {
    return c.json({ error: '모집이 종료된 체험단입니다.' }, 400)
  }
  
  // 지원 정보 저장
  const { data, error } = await supabase
    .from('applications')
    .insert({
      campaign_id: body.campaign_id,
      influencer_id: user.id,
      motivation: body.motivation,
      planned_visit_date: body.planned_visit_date,
      status: 'applied'
    })
    .select()
    .single()
  
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ data })
})

export default app
```

#### C. 단순화된 데이터베이스 스키마

```sql
-- 지원 테이블
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id),
  influencer_id UUID NOT NULL REFERENCES users(id),
  motivation TEXT NOT NULL,
  planned_visit_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'applied' CHECK (status IN ('applied', 'selected', 'rejected')),
  applied_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(campaign_id, influencer_id)
);
```

### 5. 핵심 기능 요약

1. **지원 폼**
   - 각오 한마디 입력 (필수, 500자 제한)
   - 방문 예정일 선택 (필수, 미래 날짜)

2. **유효성 검사**
   - 중복 지원 방지
   - 모집 기간 체크
   - 필수 필드 검증

3. **지원 제출**
   - 지원 정보 저장
   - 성공/에러 피드백
   - 내 지원 목록으로 이동

### 6. 구현 순서

1. **지원 폼 페이지** (기본 폼 구조)
2. **유효성 검사** (클라이언트/서버)
3. **지원 제출 처리** (API 연동)
4. **성공/에러 피드백** (사용자 경험)
5. **기본 스타일링** (Tailwind CSS)

이렇게 단순화하면 핵심 기능만 남기고 복잡한 모듈 구조를 제거할 수 있습니다. 각 기능은 독립적으로 작동하며, 필요에 따라 점진적으로 확장할 수 있습니다.