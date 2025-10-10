# 체험단 상세 조회 기능 구현 계획

## 개요

### 목적
체험단 상세 정보를 조회하고, 사용자의 역할과 로그인 상태에 따라 적절한 지원 권한 UI를 제공하는 기능 구현

### 주요 기능
1. 체험단 상세 정보 조회 (비로그인 포함 모든 사용자)
2. 사용자 인증 상태 및 역할 확인
3. 체험단 지원 가능 여부 판단
4. 지원 중복 확인
5. 상태별 액션 버튼 제공

---

## 모듈 개요

### Backend Modules

| 모듈 | 위치 | 설명 |
|------|------|------|
| Campaign Detail Schema | `src/features/campaigns/backend/schema.ts` | 상세 조회 및 지원 확인 API 스키마 추가 |
| Campaign Detail Service | `src/features/campaigns/backend/service.ts` | 상세 조회 및 지원 확인 비즈니스 로직 |
| Campaign Detail Route | `src/features/campaigns/backend/route.ts` | Hono 라우터 엔드포인트 등록 |
| Error Codes | `src/features/campaigns/backend/error.ts` | 상세 조회 관련 에러 코드 추가 |

### Frontend Modules

| 모듈 | 위치 | 설명 |
|------|------|------|
| Campaign Detail DTO | `src/features/campaigns/lib/dto.ts` | 프론트엔드용 타입 재노출 |
| Campaign Detail Hook | `src/features/campaigns/hooks/useCampaignDetail.ts` | 상세 조회 React Query 훅 (신규) |
| Application Check Hook | `src/features/campaigns/hooks/useApplicationCheck.ts` | 지원 여부 확인 React Query 훅 (신규) |
| Campaign Detail Page | `src/app/campaigns/[id]/page.tsx` | 상세 페이지 컴포넌트 (신규) |
| Campaign Detail View | `src/features/campaigns/components/campaign-detail-view.tsx` | 상세 정보 표시 컴포넌트 (신규) |
| Campaign Action Button | `src/features/campaigns/components/campaign-action-button.tsx` | 지원하기 버튼 컴포넌트 (신규) |
| Campaign Status Badge | `src/features/campaigns/components/campaign-status-badge.tsx` | 상태 뱃지 컴포넌트 (신규) |
| Campaign Image Gallery | `src/features/campaigns/components/campaign-image-gallery.tsx` | 이미지 갤러리 컴포넌트 (신규) |
| Campaign Detail Skeleton | `src/features/campaigns/components/campaign-detail-skeleton.tsx` | 로딩 스켈레톤 컴포넌트 (신규) |

### Shared/Utility Modules

| 모듈 | 위치 | 설명 |
|------|------|------|
| Application Status Utils | `src/lib/utils/application-status.ts` | 지원 가능 여부 판단 유틸 함수 (신규) |
| Status Constants | `src/constants/campaigns.ts` | 상태 관련 상수 추가 |

---

## Diagram

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Campaign Detail Page<br/>/campaigns/[id]/page.tsx]
        B[Campaign Detail View Component]
        C[Campaign Action Button Component]
        D[Campaign Status Badge Component]
        E[Campaign Image Gallery Component]
        F[Campaign Detail Skeleton Component]

        H1[useCampaignDetail Hook]
        H2[useApplicationCheck Hook]
        H3[useCurrentUser Hook]
    end

    subgraph "Data Layer"
        L1[Campaign Detail DTO]
        L2[Application Status Utils]
    end

    subgraph "Backend Layer"
        R1[GET /api/campaigns/:id<br/>Route Handler]
        R2[GET /api/applications/check<br/>Route Handler]

        S1[getCampaignById Service]
        S2[checkApplication Service]

        SC1[Campaign Detail Schema]
        SC2[Application Check Schema]

        E1[Error Codes]
    end

    subgraph "Database"
        DB[(Supabase)]
        TB1[campaigns table]
        TB2[advertiser_profiles table]
        TB3[applications table]
    end

    A --> B
    A --> F
    B --> C
    B --> D
    B --> E

    B --> H1
    C --> H1
    C --> H2
    C --> H3

    H1 --> L1
    H2 --> L1
    H1 --> R1
    H2 --> R2

    C --> L2

    R1 --> S1
    R2 --> S2

    S1 --> SC1
    S2 --> SC2

    S1 --> E1
    S2 --> E1

    S1 --> DB
    S2 --> DB

    DB --> TB1
    DB --> TB2
    DB --> TB3
```

---

## Implementation Plan

### 1. Backend Layer Implementation

#### 1.1 Schema 정의 (`src/features/campaigns/backend/schema.ts`)

**추가할 스키마:**
- `GetCampaignDetailParamsSchema`: 체험단 ID 파라미터 검증
- `GetCampaignDetailResponseSchema`: 상세 정보 응답 스키마
- `CheckApplicationQuerySchema`: 지원 확인 쿼리 파라미터 검증
- `CheckApplicationResponseSchema`: 지원 확인 응답 스키마

**Unit Tests:**
```typescript
describe('Campaign Detail Schema', () => {
  describe('GetCampaignDetailParamsSchema', () => {
    it('should validate valid UUID', () => {
      const result = GetCampaignDetailParamsSchema.safeParse({ id: 'valid-uuid-v4' });
      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID', () => {
      const result = GetCampaignDetailParamsSchema.safeParse({ id: 'invalid-id' });
      expect(result.success).toBe(false);
    });
  });

  describe('CheckApplicationQuerySchema', () => {
    it('should validate campaign_id and user_id as UUIDs', () => {
      const result = CheckApplicationQuerySchema.safeParse({
        campaign_id: 'valid-uuid-1',
        user_id: 'valid-uuid-2'
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const result = CheckApplicationQuerySchema.safeParse({ campaign_id: 'uuid' });
      expect(result.success).toBe(false);
    });
  });
});
```

---

#### 1.2 Service 계층 구현 (`src/features/campaigns/backend/service.ts`)

**추가할 함수:**

**`getCampaignById(client, campaignId)`**
- campaigns 테이블에서 ID로 조회
- advertiser_profiles와 JOIN
- applications 테이블에서 지원자 수 카운트
- 404 처리

**`checkApplication(client, campaignId, userId)`**
- applications 테이블에서 campaign_id + user_id로 조회
- 지원 여부 및 상태 반환

**Unit Tests:**
```typescript
describe('Campaign Service - Detail', () => {
  let mockClient: MockSupabaseClient;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
  });

  describe('getCampaignById', () => {
    it('should return campaign detail with advertiser info and applications count', async () => {
      mockClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCampaignData,
              error: null
            })
          })
        })
      });

      const result = await getCampaignById(mockClient, 'campaign-uuid');

      expect(result.ok).toBe(true);
      expect(result.data).toHaveProperty('advertiser');
      expect(result.data).toHaveProperty('applications_count');
    });

    it('should return 404 error when campaign not found', async () => {
      mockClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      });

      const result = await getCampaignById(mockClient, 'non-existent-uuid');

      expect(result.ok).toBe(false);
      expect(result.status).toBe(404);
      expect(result.error.code).toBe('CAMPAIGN_NOT_FOUND');
    });

    it('should handle database errors gracefully', async () => {
      mockClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(new Error('DB Error'))
          })
        })
      });

      const result = await getCampaignById(mockClient, 'campaign-uuid');

      expect(result.ok).toBe(false);
      expect(result.status).toBe(500);
    });
  });

  describe('checkApplication', () => {
    it('should return applied: true when application exists', async () => {
      mockClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: 'app-uuid', status: 'pending', created_at: '2024-01-01' },
                error: null
              })
            })
          })
        })
      });

      const result = await checkApplication(mockClient, 'campaign-uuid', 'user-uuid');

      expect(result.ok).toBe(true);
      expect(result.data.applied).toBe(true);
      expect(result.data.application).toBeDefined();
    });

    it('should return applied: false when no application found', async () => {
      mockClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }
              })
            })
          })
        })
      });

      const result = await checkApplication(mockClient, 'campaign-uuid', 'user-uuid');

      expect(result.ok).toBe(true);
      expect(result.data.applied).toBe(false);
      expect(result.data.application).toBeNull();
    });
  });
});
```

---

#### 1.3 Route 핸들러 구현 (`src/features/campaigns/backend/route.ts`)

**추가할 엔드포인트:**

**`GET /campaigns/:id`**
- Path 파라미터 검증
- getCampaignById 서비스 호출
- 응답 반환

**`GET /applications/check`**
- Query 파라미터 검증
- checkApplication 서비스 호출
- 응답 반환

**Unit Tests:**
```typescript
describe('Campaign Routes - Detail', () => {
  let app: Hono<AppEnv>;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('GET /campaigns/:id', () => {
    it('should return 200 with campaign detail', async () => {
      const res = await app.request('/campaigns/valid-uuid-123');

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('advertiser');
    });

    it('should return 400 for invalid UUID format', async () => {
      const res = await app.request('/campaigns/invalid-id');

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe('INVALID_CAMPAIGN_ID');
    });

    it('should return 404 when campaign not found', async () => {
      const res = await app.request('/campaigns/00000000-0000-0000-0000-000000000000');

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error.code).toBe('CAMPAIGN_NOT_FOUND');
    });
  });

  describe('GET /applications/check', () => {
    it('should return 200 with application status', async () => {
      const res = await app.request('/applications/check?campaign_id=uuid1&user_id=uuid2');

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty('applied');
    });

    it('should return 400 for missing query params', async () => {
      const res = await app.request('/applications/check?campaign_id=uuid1');

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe('INVALID_APPLICATION_CHECK_QUERY');
    });
  });
});
```

---

#### 1.4 Error Codes 추가 (`src/features/campaigns/backend/error.ts`)

**추가할 에러 코드:**
```typescript
export const campaignErrorCodes = {
  // ... existing codes
  notFound: 'CAMPAIGN_NOT_FOUND',
  invalidCampaignId: 'INVALID_CAMPAIGN_ID',
  applicationCheckError: 'APPLICATION_CHECK_ERROR',
  invalidApplicationCheckQuery: 'INVALID_APPLICATION_CHECK_QUERY',
} as const;
```

---

### 2. Frontend Layer Implementation

#### 2.1 DTO 재노출 (`src/features/campaigns/lib/dto.ts`)

**추가할 export:**
```typescript
export {
  GetCampaignDetailResponseSchema,
  CheckApplicationResponseSchema,
  type GetCampaignDetailResponse,
  type CheckApplicationResponse,
  // ... existing exports
} from '../backend/schema';
```

---

#### 2.2 React Query Hooks

**`useCampaignDetail` (`src/features/campaigns/hooks/useCampaignDetail.ts`)**

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { GetCampaignDetailResponseSchema, type GetCampaignDetailResponse } from '../lib/dto';

export const useCampaignDetail = (campaignId: string) => {
  return useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async () => {
      const response = await apiClient.get(`/campaigns/${campaignId}`);
      return GetCampaignDetailResponseSchema.parse(response.data);
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
};
```

**`useApplicationCheck` (`src/features/campaigns/hooks/useApplicationCheck.ts`)**

```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { CheckApplicationResponseSchema } from '../lib/dto';

export const useApplicationCheck = (campaignId: string, userId?: string) => {
  return useQuery({
    queryKey: ['application-check', campaignId, userId],
    queryFn: async () => {
      if (!userId) return { applied: false, application: null };

      const response = await apiClient.get('/applications/check', {
        params: { campaign_id: campaignId, user_id: userId }
      });
      return CheckApplicationResponseSchema.parse(response.data);
    },
    enabled: !!userId,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
```

---

#### 2.3 Utility Functions

**`src/lib/utils/application-status.ts` (신규)**

```typescript
import { differenceInDays } from 'date-fns';

export type ApplicationEligibility = {
  canApply: boolean;
  reason?: 'not_authenticated' | 'not_influencer' | 'already_applied' |
           'recruitment_not_started' | 'recruitment_ended' | 'profile_required';
  message: string;
};

export const checkApplicationEligibility = (params: {
  isAuthenticated: boolean;
  userRole?: 'influencer' | 'advertiser';
  hasInfluencerProfile?: boolean;
  alreadyApplied: boolean;
  recruitmentStartDate: string;
  recruitmentEndDate: string;
  campaignStatus: string;
}): ApplicationEligibility => {
  const {
    isAuthenticated,
    userRole,
    hasInfluencerProfile,
    alreadyApplied,
    recruitmentStartDate,
    recruitmentEndDate,
    campaignStatus
  } = params;

  if (!isAuthenticated) {
    return {
      canApply: false,
      reason: 'not_authenticated',
      message: '로그인 후 지원 가능합니다'
    };
  }

  if (userRole !== 'influencer') {
    return {
      canApply: false,
      reason: 'not_influencer',
      message: '광고주는 지원할 수 없습니다'
    };
  }

  if (!hasInfluencerProfile) {
    return {
      canApply: false,
      reason: 'profile_required',
      message: '인플루언서 정보를 먼저 등록해주세요'
    };
  }

  if (alreadyApplied) {
    return {
      canApply: false,
      reason: 'already_applied',
      message: '이미 지원한 체험단입니다'
    };
  }

  if (campaignStatus !== 'recruiting') {
    return {
      canApply: false,
      reason: 'recruitment_ended',
      message: '모집이 종료되었습니다'
    };
  }

  const today = new Date();
  const startDate = new Date(recruitmentStartDate);
  const endDate = new Date(recruitmentEndDate);

  if (today < startDate) {
    return {
      canApply: false,
      reason: 'recruitment_not_started',
      message: '아직 모집 기간이 아닙니다'
    };
  }

  if (today > endDate) {
    return {
      canApply: false,
      reason: 'recruitment_ended',
      message: '모집 기간이 종료되었습니다'
    };
  }

  return {
    canApply: true,
    message: '지원 가능'
  };
};
```

**Unit Tests:**
```typescript
describe('Application Status Utils', () => {
  describe('checkApplicationEligibility', () => {
    const baseParams = {
      isAuthenticated: true,
      userRole: 'influencer' as const,
      hasInfluencerProfile: true,
      alreadyApplied: false,
      recruitmentStartDate: '2024-01-01',
      recruitmentEndDate: '2024-12-31',
      campaignStatus: 'recruiting',
    };

    it('should return canApply: true for eligible influencer', () => {
      const result = checkApplicationEligibility(baseParams);
      expect(result.canApply).toBe(true);
    });

    it('should return canApply: false when not authenticated', () => {
      const result = checkApplicationEligibility({
        ...baseParams,
        isAuthenticated: false
      });
      expect(result.canApply).toBe(false);
      expect(result.reason).toBe('not_authenticated');
    });

    it('should return canApply: false when user is advertiser', () => {
      const result = checkApplicationEligibility({
        ...baseParams,
        userRole: 'advertiser'
      });
      expect(result.canApply).toBe(false);
      expect(result.reason).toBe('not_influencer');
    });

    it('should return canApply: false when already applied', () => {
      const result = checkApplicationEligibility({
        ...baseParams,
        alreadyApplied: true
      });
      expect(result.canApply).toBe(false);
      expect(result.reason).toBe('already_applied');
    });

    it('should return canApply: false when recruitment not started', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const result = checkApplicationEligibility({
        ...baseParams,
        recruitmentStartDate: futureDate.toISOString()
      });
      expect(result.canApply).toBe(false);
      expect(result.reason).toBe('recruitment_not_started');
    });

    it('should return canApply: false when recruitment ended', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      const result = checkApplicationEligibility({
        ...baseParams,
        recruitmentEndDate: pastDate.toISOString()
      });
      expect(result.canApply).toBe(false);
      expect(result.reason).toBe('recruitment_ended');
    });
  });
});
```

---

#### 2.4 UI Components

**`CampaignDetailView` (`src/features/campaigns/components/campaign-detail-view.tsx`)**

**QA Sheet:**
```markdown
## Campaign Detail View Component QA

### Display Tests
- [ ] 체험단 제목이 올바르게 표시되는가?
- [ ] 광고주 정보(업체명, 카테고리, 위치)가 표시되는가?
- [ ] 모집 기간이 올바른 형식으로 표시되는가?
- [ ] 제공 혜택이 표시되는가?
- [ ] 미션 내용이 표시되는가?
- [ ] 매장 정보가 표시되는가?
- [ ] 현재 지원자 수가 표시되는가?

### State Tests
- [ ] 상태 배지가 올바르게 표시되는가? (모집중/모집종료/완료)
- [ ] D-day가 정확하게 계산되어 표시되는가?
- [ ] 마감 임박 시 시각적 강조가 되는가?

### Layout Tests
- [ ] 데스크톱에서 좌우 레이아웃이 올바른가?
- [ ] 모바일에서 세로 스택 레이아웃으로 전환되는가?
- [ ] 컨테이너 최대 너비(1024px)가 적용되는가?

### Accessibility Tests
- [ ] Heading 구조가 올바른가?
- [ ] 이미지에 적절한 alt 텍스트가 있는가?
- [ ] 키보드 네비게이션이 작동하는가?
```

---

**`CampaignActionButton` (`src/features/campaigns/components/campaign-action-button.tsx`)**

**QA Sheet:**
```markdown
## Campaign Action Button Component QA

### Button States
- [ ] 비로그인 시 "로그인하고 지원하기" 버튼이 표시되는가?
- [ ] 로그인 + 인플루언서 + 지원 가능 시 "지원하기" 버튼이 활성화되는가?
- [ ] 이미 지원한 경우 "지원 완료" 버튼이 비활성화되는가?
- [ ] 모집 종료 시 "모집 종료" 버튼이 비활성화되는가?
- [ ] 광고주인 경우 지원 불가 안내가 표시되는가?
- [ ] 프로필 미등록 시 "프로필 등록하기" 버튼이 표시되는가?

### Interaction Tests
- [ ] 비로그인 상태에서 클릭 시 로그인 페이지로 이동하는가?
- [ ] 지원하기 버튼 클릭 시 지원 페이지로 이동하는가?
- [ ] 프로필 등록 버튼 클릭 시 프로필 등록 페이지로 이동하는가?
- [ ] 비활성화된 버튼은 클릭이 안 되는가?

### Visual Tests
- [ ] 버튼 색상이 상태별로 올바르게 표시되는가?
- [ ] 호버 효과가 작동하는가?
- [ ] 로딩 중 스피너가 표시되는가?
- [ ] 안내 메시지가 적절한 위치에 표시되는가?

### Accessibility Tests
- [ ] aria-label이 적절하게 설정되어 있는가?
- [ ] 비활성화 상태가 스크린 리더에 전달되는가?
- [ ] 포커스 스타일이 명확한가?
```

---

**`CampaignStatusBadge` (`src/features/campaigns/components/campaign-status-badge.tsx`)**

**QA Sheet:**
```markdown
## Campaign Status Badge Component QA

### Display Tests
- [ ] '모집중' 상태가 초록색 배지로 표시되는가?
- [ ] '모집종료' 상태가 회색 배지로 표시되는가?
- [ ] '완료' 상태가 파란색 배지로 표시되는가?
- [ ] D-day 배지가 올바르게 표시되는가?
- [ ] 인기 배지가 지원자 수 20명 이상일 때 표시되는가?

### Visual Tests
- [ ] 배지 크기가 일관성 있는가?
- [ ] 배지 간격이 적절한가?
- [ ] 텍스트가 읽기 쉬운가?
```

---

**`CampaignImageGallery` (`src/features/campaigns/components/campaign-image-gallery.tsx`)**

**QA Sheet:**
```markdown
## Campaign Image Gallery Component QA

### Display Tests
- [ ] 플레이스홀더 이미지가 올바르게 표시되는가?
- [ ] aspect-video 비율이 유지되는가?
- [ ] 이미지 로딩 중 블러 효과가 표시되는가?
- [ ] 이미지 로딩 실패 시 폴백 이미지가 표시되는가?

### Interaction Tests
- [ ] 이미지 클릭 시 확대 모달이 열리는가?
- [ ] 모달에서 ESC 키로 닫기가 되는가?
- [ ] 모달 외부 클릭 시 닫히는가?

### Performance Tests
- [ ] Next.js Image 컴포넌트가 사용되는가?
- [ ] Lazy loading이 적용되는가?
```

---

**`CampaignDetailSkeleton` (`src/features/campaigns/components/campaign-detail-skeleton.tsx`)**

**QA Sheet:**
```markdown
## Campaign Detail Skeleton Component QA

### Layout Tests
- [ ] 스켈레톤이 실제 컨텐츠 레이아웃과 유사한가?
- [ ] 데스크톱에서 좌우 레이아웃이 올바른가?
- [ ] 모바일에서 세로 스택으로 전환되는가?

### Animation Tests
- [ ] 펄스 애니메이션이 부드럽게 작동하는가?
- [ ] 애니메이션이 과하지 않은가?

### Accessibility Tests
- [ ] aria-busy 속성이 설정되어 있는가?
- [ ] 로딩 상태가 스크린 리더에 전달되는가?
```

---

**`CampaignDetailPage` (`src/app/campaigns/[id]/page.tsx`)**

**QA Sheet:**
```markdown
## Campaign Detail Page QA

### Page Load Tests
- [ ] 페이지가 올바르게 로드되는가?
- [ ] params.id가 올바르게 파싱되는가?
- [ ] 로딩 중 스켈레톤이 표시되는가?
- [ ] 에러 발생 시 에러 메시지가 표시되는가?

### SEO Tests
- [ ] 페이지 title이 동적으로 설정되는가?
- [ ] meta description이 설정되는가?
- [ ] Open Graph 태그가 설정되는가?

### Navigation Tests
- [ ] 뒤로가기 버튼이 작동하는가?
- [ ] 목록으로 돌아가기 링크가 있는가?

### Error Handling Tests
- [ ] 존재하지 않는 체험단 접근 시 404 페이지가 표시되는가?
- [ ] 네트워크 에러 시 재시도 버튼이 표시되는가?
- [ ] 타임아웃 시 적절한 메시지가 표시되는가?
```

---

### 3. Constants 추가

**`src/constants/campaigns.ts`**

```typescript
// 기존 상수 유지
export const CAMPAIGN_STATUS = {
  RECRUITING: 'recruiting',
  CLOSED: 'closed',
  COMPLETED: 'completed',
} as const;

export const CAMPAIGN_SORT = {
  LATEST: 'latest',
  DEADLINE: 'deadline',
  POPULAR: 'popular',
} as const;

export const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 50,
} as const;

// 신규 추가
export const STATUS_BADGE_VARIANTS = {
  recruiting: { variant: 'success', label: '모집중' },
  closed: { variant: 'secondary', label: '모집종료' },
  completed: { variant: 'default', label: '완료' },
} as const;

export const APPLICATION_STATUS = {
  PENDING: 'pending',
  SELECTED: 'selected',
  REJECTED: 'rejected',
} as const;

export const APPLICATION_STATUS_LABELS = {
  pending: '대기중',
  selected: '선정',
  rejected: '반려',
} as const;
```

---

## Implementation Order

### Phase 1: Backend Foundation
1. Error codes 추가
2. Schema 정의
3. Service 계층 구현 및 테스트
4. Route 핸들러 구현 및 테스트

### Phase 2: Frontend Data Layer
1. DTO 재노출
2. Utility functions 구현 및 테스트
3. React Query hooks 구현
4. Constants 추가

### Phase 3: UI Components
1. CampaignStatusBadge (가장 간단)
2. CampaignDetailSkeleton
3. CampaignImageGallery
4. CampaignActionButton (비즈니스 로직 포함)
5. CampaignDetailView (메인 컴포넌트)

### Phase 4: Page Integration
1. Campaign Detail Page 구현
2. Page 라우팅 연결
3. SEO 메타데이터 설정

### Phase 5: Testing & Polish
1. 통합 테스트
2. QA Sheet 기반 검증
3. 접근성 검증
4. 성능 최적화

---

## Testing Strategy

### Backend Tests
- **Unit Tests**: 각 service 함수 및 schema 검증
- **Integration Tests**: Route 핸들러 end-to-end 테스트
- **Error Cases**: 404, 400, 500 에러 시나리오

### Frontend Tests
- **Unit Tests**: Utility 함수 및 hooks 로직
- **Component Tests**: UI 컴포넌트 렌더링 및 상호작용
- **QA Sheet**: 수동 테스트 체크리스트
- **Accessibility Tests**: aria-label, keyboard navigation, screen reader

### E2E Tests
- 비로그인 사용자 플로우
- 인플루언서 지원 가능 플로우
- 광고주 접근 제한 플로우
- 이미 지원한 경우 플로우
- 에러 페이지 플로우

---

## Performance Considerations

### Backend
- JOIN 쿼리 최적화 (advertiser_profiles)
- 지원자 수 카운트 쿼리 최적화
- 인덱스 활용 (campaigns.id, applications.campaign_id)

### Frontend
- React Query 캐싱 (5분)
- 컴포넌트 코드 스플리팅
- 이미지 lazy loading
- Next.js Image 최적화
- Skeleton UI로 체감 성능 향상

---

## Security & Authorization

### Backend
- UUID 형식 검증
- SQL Injection 방지 (Supabase ORM 사용)
- Rate limiting 고려

### Frontend
- XSS 방지 (React escape 기본 제공)
- CSRF 토큰 검증
- 민감 정보 노출 방지 (광고주 연락처 숨김)

---

## Error Handling

### Backend Errors
- `CAMPAIGN_NOT_FOUND` (404)
- `INVALID_CAMPAIGN_ID` (400)
- `APPLICATION_CHECK_ERROR` (500)
- `CAMPAIGNS_DATABASE_ERROR` (500)

### Frontend Error States
- 네트워크 에러: 재시도 버튼 제공
- 404 에러: 목록으로 돌아가기
- 권한 에러: 적절한 안내 메시지
- 타임아웃: 10초 후 에러 표시

---

## Accessibility Requirements

- Semantic HTML 사용 (heading, section, article)
- ARIA labels 적절히 설정
- 키보드 네비게이션 지원 (Tab, Enter, Esc)
- 색상 대비 충분히 확보 (WCAG AA 이상)
- Screen reader 친화적 메시지
- 포커스 관리 (모달 열림/닫힘)

---

## Future Enhancements

- 실시간 지원자 수 업데이트 (WebSocket)
- 체험단 공유 기능 (SNS)
- 북마크 기능
- 관련 체험단 추천
- 이미지 갤러리 슬라이드
- 매장 위치 지도 연동 (카카오맵)
- 리뷰 섹션 (체험단 완료 후)
