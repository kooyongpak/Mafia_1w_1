# 체험단 지원 기능 구현 계획

## 개요

### 목적
인플루언서가 체험단에 지원서를 작성하고 제출하는 기능 구현

### 주요 기능
1. 체험단 지원 폼 페이지 (`/campaigns/{id}/apply`)
2. 지원서 입력 및 검증 (각오 한마디, 방문 예정일자)
3. 지원 가능 여부 확인 (권한, 중복, 모집 기간)
4. 지원서 제출 및 DB 저장
5. 성공 후 내 지원 목록으로 이동

---

## 모듈 개요

### Backend Modules

| 모듈 | 위치 | 설명 |
|------|------|------|
| Application Schema | `src/features/applications/backend/schema.ts` | 지원서 요청/응답 스키마 정의 (신규 feature) |
| Application Service | `src/features/applications/backend/service.ts` | 지원서 생성 비즈니스 로직 |
| Application Route | `src/features/applications/backend/route.ts` | Hono 라우터 엔드포인트 등록 |
| Application Error | `src/features/applications/backend/error.ts` | 에러 코드 정의 |

### Frontend Modules

| 모듈 | 위치 | 설명 |
|------|------|------|
| Application DTO | `src/features/applications/lib/dto.ts` | 프론트엔드용 타입 재노출 |
| Application Create Hook | `src/features/applications/hooks/useCreateApplication.ts` | 지원서 제출 React Query Mutation 훅 |
| Campaign Apply Page | `src/app/campaigns/[id]/apply/page.tsx` | 지원 페이지 |
| Application Form | `src/features/applications/components/application-form.tsx` | 지원서 폼 컴포넌트 |
| Campaign Summary Card | `src/features/campaigns/components/campaign-summary-card.tsx` | 체험단 요약 카드 |

### Shared/Utility Modules

| 모듈 | 위치 | 설명 |
|------|------|------|
| Date Validation Utils | `src/lib/utils/date-validation.ts` | 날짜 검증 유틸 (신규) |
| Application Constants | `src/constants/applications.ts` | 지원 관련 상수 (신규) |

---

## Diagram

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Campaign Apply Page<br/>/campaigns/[id]/apply/page.tsx]
        B[Application Form Component]
        C[Campaign Summary Card Component]

        H1[useCreateApplication Hook]
        H2[useCampaignDetail Hook - 재사용]
        H3[useCurrentUser Hook - 재사용]
    end

    subgraph "Data Layer"
        L1[Application DTO]
        L2[Date Validation Utils]
    end

    subgraph "Backend Layer"
        R1[POST /api/applications<br/>Route Handler]

        S1[createApplication Service]
        S2[getCampaignById Service - 재사용]

        SC1[Application Request Schema]
        SC2[Application Response Schema]

        E1[Application Error Codes]
    end

    subgraph "Database"
        DB[(Supabase)]
        TB1[applications table]
        TB2[campaigns table]
        TB3[users table]
        TB4[influencer_profiles table]
    end

    A --> B
    A --> C

    B --> H1
    B --> H3
    C --> H2

    H1 --> L1
    H1 --> R1
    H2 --> L1

    B --> L2

    R1 --> S1
    R1 --> S2

    S1 --> SC1
    S1 --> SC2
    S1 --> E1

    S1 --> DB
    S2 --> DB

    DB --> TB1
    DB --> TB2
    DB --> TB3
    DB --> TB4
```

---

## Implementation Plan

### 1. Backend Layer Implementation

#### 1.1 Error Codes 정의 (`src/features/applications/backend/error.ts`)

**에러 코드:**
```typescript
export const applicationErrorCodes = {
  invalidInput: 'INVALID_INPUT',
  campaignNotFound: 'CAMPAIGN_NOT_FOUND',
  campaignNotAvailable: 'CAMPAIGN_NOT_AVAILABLE',
  alreadyApplied: 'ALREADY_APPLIED',
  recruitmentClosed: 'RECRUITMENT_CLOSED',
  unauthorized: 'UNAUTHORIZED',
  forbidden: 'FORBIDDEN',
  databaseError: 'DATABASE_ERROR',
} as const;
```

---

#### 1.2 Schema 정의 (`src/features/applications/backend/schema.ts`)

**추가할 스키마:**
- `CreateApplicationRequestSchema`: 지원서 생성 요청
- `CreateApplicationResponseSchema`: 지원서 생성 응답

**Unit Tests:**
```typescript
describe('Application Schema', () => {
  describe('CreateApplicationRequestSchema', () => {
    it('should validate valid application data', () => {
      const validData = {
        campaign_id: 'valid-uuid',
        message: '각오 한마디',
        visit_date: '2024-12-31'
      };
      const result = CreateApplicationRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty message', () => {
      const invalidData = {
        campaign_id: 'valid-uuid',
        message: '',
        visit_date: '2024-12-31'
      };
      const result = CreateApplicationRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject message over 500 characters', () => {
      const invalidData = {
        campaign_id: 'valid-uuid',
        message: 'a'.repeat(501),
        visit_date: '2024-12-31'
      };
      const result = CreateApplicationRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid date format', () => {
      const invalidData = {
        campaign_id: 'valid-uuid',
        message: '각오 한마디',
        visit_date: '2024/12/31'
      };
      const result = CreateApplicationRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID', () => {
      const invalidData = {
        campaign_id: 'invalid-id',
        message: '각오 한마디',
        visit_date: '2024-12-31'
      };
      const result = CreateApplicationRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
```

---

#### 1.3 Service 계층 구현 (`src/features/applications/backend/service.ts`)

**추가할 함수:**

**`createApplication(client, userId, data)`**
- 1. 체험단 존재 및 상태 확인 (campaigns 테이블)
- 2. 인플루언서 프로필 확인 (influencer_profiles 테이블)
- 3. 중복 지원 확인 (applications 테이블)
- 4. 모집 기간 검증
- 5. applications 테이블에 INSERT
- 6. 생성된 지원서 정보 반환

**Unit Tests:**
```typescript
describe('Application Service', () => {
  let mockClient: MockSupabaseClient;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
  });

  describe('createApplication', () => {
    const validData = {
      campaign_id: 'campaign-uuid',
      message: '각오 한마디',
      visit_date: '2024-12-31'
    };
    const userId = 'user-uuid';

    it('should create application successfully', async () => {
      mockClient.from.mockImplementation((table) => {
        if (table === 'campaigns') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'campaign-uuid',
                    status: 'recruiting',
                    recruitment_start_date: '2024-01-01',
                    recruitment_end_date: '2024-12-31'
                  },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'influencer_profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'profile-uuid' },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' }
                  })
                })
              })
            }),
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'application-uuid',
                    campaign_id: 'campaign-uuid',
                    user_id: userId,
                    message: '각오 한마디',
                    visit_date: '2024-12-31',
                    status: 'pending',
                    created_at: '2024-01-01T00:00:00Z'
                  },
                  error: null
                })
              })
            })
          };
        }
      });

      const result = await createApplication(mockClient, userId, validData);

      expect(result.ok).toBe(true);
      expect(result.data.status).toBe('pending');
    });

    it('should return 404 when campaign not found', async () => {
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

      const result = await createApplication(mockClient, userId, validData);

      expect(result.ok).toBe(false);
      expect(result.error.code).toBe('CAMPAIGN_NOT_FOUND');
    });

    it('should return 400 when campaign status is not recruiting', async () => {
      mockClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'campaign-uuid', status: 'closed' },
              error: null
            })
          })
        })
      });

      const result = await createApplication(mockClient, userId, validData);

      expect(result.ok).toBe(false);
      expect(result.error.code).toBe('CAMPAIGN_NOT_AVAILABLE');
    });

    it('should return 403 when influencer profile not found', async () => {
      mockClient.from.mockImplementation((table) => {
        if (table === 'campaigns') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'campaign-uuid',
                    status: 'recruiting',
                    recruitment_start_date: '2024-01-01',
                    recruitment_end_date: '2024-12-31'
                  },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'influencer_profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' }
                })
              })
            })
          };
        }
      });

      const result = await createApplication(mockClient, userId, validData);

      expect(result.ok).toBe(false);
      expect(result.error.code).toBe('FORBIDDEN');
    });

    it('should return 409 when already applied', async () => {
      mockClient.from.mockImplementation((table) => {
        if (table === 'campaigns') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: {
                    id: 'campaign-uuid',
                    status: 'recruiting',
                    recruitment_start_date: '2024-01-01',
                    recruitment_end_date: '2024-12-31'
                  },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'influencer_profiles') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { id: 'profile-uuid' },
                  error: null
                })
              })
            })
          };
        }
        if (table === 'applications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: { id: 'existing-application' },
                    error: null
                  })
                })
              })
            })
          };
        }
      });

      const result = await createApplication(mockClient, userId, validData);

      expect(result.ok).toBe(false);
      expect(result.error.code).toBe('ALREADY_APPLIED');
    });

    it('should return 400 when recruitment period ended', async () => {
      mockClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'campaign-uuid',
                status: 'recruiting',
                recruitment_start_date: '2023-01-01',
                recruitment_end_date: '2023-12-31'
              },
              error: null
            })
          })
        })
      });

      const result = await createApplication(mockClient, userId, validData);

      expect(result.ok).toBe(false);
      expect(result.error.code).toBe('RECRUITMENT_CLOSED');
    });
  });
});
```

---

#### 1.4 Route 핸들러 구현 (`src/features/applications/backend/route.ts`)

**추가할 엔드포인트:**

**`POST /applications`**
- 요청 body 검증
- 사용자 인증 확인 (JWT 토큰)
- createApplication 서비스 호출
- 응답 반환

**Unit Tests:**
```typescript
describe('Application Routes', () => {
  let app: Hono<AppEnv>;

  beforeEach(() => {
    app = createTestApp();
  });

  describe('POST /applications', () => {
    const validBody = {
      campaign_id: 'campaign-uuid',
      message: '각오 한마디',
      visit_date: '2024-12-31'
    };

    it('should return 201 when application created', async () => {
      const res = await app.request('/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify(validBody)
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data).toHaveProperty('id');
      expect(body.data.status).toBe('pending');
    });

    it('should return 400 for invalid input', async () => {
      const res = await app.request('/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({ ...validBody, message: '' })
      });

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error.code).toBe('INVALID_INPUT');
    });

    it('should return 401 when not authenticated', async () => {
      const res = await app.request('/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(validBody)
      });

      expect(res.status).toBe(401);
    });

    it('should return 409 when already applied', async () => {
      const res = await app.request('/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify(validBody)
      });

      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.error.code).toBe('ALREADY_APPLIED');
    });
  });
});
```

---

### 2. Frontend Layer Implementation

#### 2.1 DTO 재노출 (`src/features/applications/lib/dto.ts`)

**Export:**
```typescript
export {
  CreateApplicationRequestSchema,
  CreateApplicationResponseSchema,
  type CreateApplicationRequest,
  type CreateApplicationResponse,
} from '../backend/schema';
```

---

#### 2.2 React Query Mutation Hook

**`useCreateApplication` (`src/features/applications/hooks/useCreateApplication.ts`)**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { CreateApplicationRequestSchema, type CreateApplicationResponse } from '../lib/dto';
import { useRouter } from 'next/navigation';

export const useCreateApplication = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: CreateApplicationRequest) => {
      const validated = CreateApplicationRequestSchema.parse(data);
      const response = await apiClient.post('/applications', validated);
      return response.data as CreateApplicationResponse;
    },
    onSuccess: (data, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['application-check', variables.campaign_id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });

      // Redirect to applications list
      router.push('/applications');
    },
  });
};
```

---

#### 2.3 Utility Functions

**`src/lib/utils/date-validation.ts` (신규)**

```typescript
export const isValidVisitDate = (
  visitDate: string,
  recruitmentStartDate: string,
  recruitmentEndDate: string
): { valid: boolean; error?: string } => {
  const visit = new Date(visitDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (visit < today) {
    return { valid: false, error: '방문 예정일은 오늘 이후여야 합니다' };
  }

  const start = new Date(recruitmentStartDate);
  const end = new Date(recruitmentEndDate);

  if (visit < start || visit > end) {
    return { valid: false, error: '모집 기간 내 날짜를 선택해주세요' };
  }

  return { valid: true };
};

export const getMinVisitDate = (): string => {
  const today = new Date();
  today.setDate(today.getDate() + 1);
  return today.toISOString().split('T')[0];
};
```

**Unit Tests:**
```typescript
describe('Date Validation Utils', () => {
  describe('isValidVisitDate', () => {
    it('should accept future date within recruitment period', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const visitDate = tomorrow.toISOString().split('T')[0];

      const result = isValidVisitDate(visitDate, '2024-01-01', '2024-12-31');
      expect(result.valid).toBe(true);
    });

    it('should reject past date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const visitDate = yesterday.toISOString().split('T')[0];

      const result = isValidVisitDate(visitDate, '2024-01-01', '2024-12-31');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('방문 예정일은 오늘 이후여야 합니다');
    });

    it('should reject date outside recruitment period', () => {
      const result = isValidVisitDate('2025-01-01', '2024-01-01', '2024-12-31');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('모집 기간 내 날짜를 선택해주세요');
    });
  });
});
```

---

#### 2.4 UI Components

**`ApplicationForm` (`src/features/applications/components/application-form.tsx`)**

**QA Sheet:**
```markdown
## Application Form Component QA

### Display Tests
- [ ] 각오 한마디 textarea가 표시되는가?
- [ ] 방문 예정일자 input (type="date")가 표시되는가?
- [ ] 제출하기 버튼이 표시되는가?
- [ ] 글자 수 카운터가 표시되는가? (0/500)

### Validation Tests
- [ ] 각오 한마디 빈 값 제출 시 에러 메시지 표시되는가?
- [ ] 각오 한마디 500자 초과 시 에러 메시지 표시되는가?
- [ ] 방문 예정일자 미선택 시 에러 메시지 표시되는가?
- [ ] 과거 날짜 선택 시 에러 메시지 표시되는가?
- [ ] 모집 기간 외 날짜 선택 시 에러 메시지 표시되는가?

### Interaction Tests
- [ ] 입력 중 실시간으로 글자 수가 업데이트되는가?
- [ ] 필수 입력값 미입력 시 제출 버튼이 비활성화되는가?
- [ ] 제출 중 버튼이 비활성화되고 로딩 표시되는가?
- [ ] 제출 성공 시 성공 메시지가 표시되는가?
- [ ] 제출 실패 시 에러 메시지가 표시되는가?

### Accessibility Tests
- [ ] label이 input과 올바르게 연결되어 있는가?
- [ ] 에러 메시지가 aria-live로 전달되는가?
- [ ] 키보드 네비게이션이 작동하는가?
- [ ] 필수 필드에 aria-required가 설정되어 있는가?
```

---

**`CampaignSummaryCard` (`src/features/campaigns/components/campaign-summary-card.tsx`)**

**QA Sheet:**
```markdown
## Campaign Summary Card Component QA

### Display Tests
- [ ] 체험단 제목이 표시되는가?
- [ ] 모집 기간이 올바른 형식으로 표시되는가?
- [ ] 제공 혜택이 표시되는가?
- [ ] 광고주명이 표시되는가?
- [ ] 상태 배지가 표시되는가?

### Layout Tests
- [ ] 카드 레이아웃이 적절한가?
- [ ] 모바일에서 올바르게 표시되는가?
- [ ] 텍스트가 읽기 쉬운가?
```

---

**`CampaignApplyPage` (`src/app/campaigns/[id]/apply/page.tsx`)**

**QA Sheet:**
```markdown
## Campaign Apply Page QA

### Authentication Tests
- [ ] 비로그인 사용자 접근 시 로그인 페이지로 리다이렉트되는가?
- [ ] returnUrl이 올바르게 설정되는가?
- [ ] 광고주 접근 시 에러 메시지 표시 후 리다이렉트되는가?
- [ ] 프로필 미등록 시 프로필 등록 페이지로 리다이렉트되는가?

### Page Load Tests
- [ ] 페이지가 올바르게 로드되는가?
- [ ] params.id가 올바르게 파싱되는가?
- [ ] 로딩 중 스켈레톤이 표시되는가?
- [ ] 체험단 정보가 올바르게 표시되는가?

### Form Tests
- [ ] 지원 폼이 올바르게 표시되는가?
- [ ] 제출 성공 시 내 지원 목록으로 이동하는가?
- [ ] 제출 실패 시 에러 처리가 올바른가?

### Error Handling Tests
- [ ] 존재하지 않는 체험단 접근 시 404 페이지가 표시되는가?
- [ ] 모집 종료된 체험단 접근 시 적절한 메시지가 표시되는가?
- [ ] 이미 지원한 체험단 접근 시 리다이렉트되는가?
- [ ] 네트워크 에러 시 재시도 버튼이 제공되는가?

### Navigation Tests
- [ ] 뒤로가기 버튼이 작동하는가?
- [ ] 브라우저 뒤로가기가 작동하는가?
```

---

### 3. Constants 추가

**`src/constants/applications.ts` (신규)**

```typescript
export const APPLICATION_CONSTRAINTS = {
  MESSAGE_MIN_LENGTH: 1,
  MESSAGE_MAX_LENGTH: 500,
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
5. Hono 앱에 route 등록

### Phase 2: Frontend Data Layer
1. DTO 재노출
2. Date validation utils 구현 및 테스트
3. Constants 추가
4. React Query mutation hook 구현

### Phase 3: UI Components
1. CampaignSummaryCard (재사용 가능)
2. ApplicationForm (핵심 컴포넌트)

### Phase 4: Page Integration
1. Campaign Apply Page 구현
2. 인증 가드 추가
3. 페이지 라우팅 연결

### Phase 5: Testing & Polish
1. 통합 테스트
2. QA Sheet 기반 검증
3. 접근성 검증
4. 에러 처리 완성도 확인

---

## Testing Strategy

### Backend Tests
- **Unit Tests**: Schema 검증, Service 로직 (6개 시나리오)
- **Integration Tests**: Route 핸들러 end-to-end
- **Error Cases**: 401, 403, 404, 409, 400, 500

### Frontend Tests
- **Unit Tests**: Date validation 함수
- **Component Tests**: Form 입력 및 검증
- **QA Sheet**: 수동 테스트 체크리스트

### E2E Tests
- 정상 지원 플로우 (입력 → 제출 → 성공)
- 중복 지원 방지
- 권한 없는 사용자 차단
- 모집 종료된 체험단 처리

---

## Performance Considerations

### Backend
- 중복 지원 확인: UNIQUE constraint 활용
- 인덱스 활용: (campaign_id, user_id)
- 트랜잭션 고려: 체험단 조회 + 지원서 생성

### Frontend
- React Query mutation으로 낙관적 업데이트 고려
- Form validation: 클라이언트 + 서버 이중 검증
- Debounce: 글자 수 카운터

---

## Security & Authorization

### Backend
- JWT 토큰 검증 필수
- 사용자 권한 확인 (인플루언서만 허용)
- SQL Injection 방지 (ORM 사용)
- Rate limiting (동일 사용자 반복 요청 제한)

### Frontend
- XSS 방지 (React escape)
- CSRF 토큰 검증
- 민감 정보 노출 방지

---

## Error Handling

### Backend Errors
- `INVALID_INPUT` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `CAMPAIGN_NOT_FOUND` (404)
- `ALREADY_APPLIED` (409)
- `CAMPAIGN_NOT_AVAILABLE` (400)
- `RECRUITMENT_CLOSED` (400)
- `DATABASE_ERROR` (500)

### Frontend Error States
- 네트워크 에러: 재시도 버튼
- 중복 지원: 내 지원 목록으로 리다이렉트
- 권한 없음: 로그인 페이지로 리다이렉트
- 입력 오류: 인라인 에러 메시지

---

## Accessibility Requirements

- Semantic HTML (form, label, input)
- ARIA labels 적절히 설정
- 키보드 네비게이션 (Tab, Enter)
- 에러 메시지 aria-live
- 색상 대비 충분히 확보 (WCAG AA)
- Screen reader 친화적 메시지

---

## Future Enhancements

- 지원서 임시 저장 기능
- 지원서 수정 기능 (선정 전)
- 파일 첨부 (프로필 이미지, 포트폴리오)
- 알림 기능 (지원 완료, 선정 결과)
- 지원 취소 기능
