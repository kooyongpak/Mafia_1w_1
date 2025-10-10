# 광고주 체험단 상세 & 모집 관리 - 구현 계획

## 개요

### 신규 모듈

#### Backend Layer
1. **campaigns/backend/schema.ts (확장)**
   - 위치: `src/features/campaigns/backend/schema.ts`
   - 설명: 체험단 상세 조회 with 지원자, 모집 종료, 체험단 선정 API 스키마 추가
   - 의존성: zod, applications/backend/schema

2. **campaigns/backend/service.ts (확장)**
   - 위치: `src/features/campaigns/backend/service.ts`
   - 설명: `getAdvertiserCampaignDetail`, `closeCampaign`, `selectApplicants` 서비스 함수 추가
   - 의존성: Supabase, HandlerResult pattern, 트랜잭션

3. **campaigns/backend/route.ts (확장)**
   - 위치: `src/features/campaigns/backend/route.ts`
   - 설명: GET /api/campaigns/my/:id, PATCH /api/campaigns/:id/close, POST /api/campaigns/:id/select 라우트 추가
   - 의존성: Hono, service layer, 권한 검증

4. **campaigns/backend/error.ts (확장)**
   - 위치: `src/features/campaigns/backend/error.ts`
   - 설명: 모집 관리 관련 에러 코드 추가 (invalidStatus, selectionError 등)
   - 의존성: 없음

#### Frontend Data Layer
5. **campaigns/lib/dto.ts (확장)**
   - 위치: `src/features/campaigns/lib/dto.ts`
   - 설명: 신규 스키마 재노출
   - 의존성: backend/schema

6. **campaigns/hooks/useAdvertiserCampaignDetail.ts (신규)**
   - 위치: `src/features/campaigns/hooks/useAdvertiserCampaignDetail.ts`
   - 설명: React Query hook for GET /api/campaigns/my/:id (with applications)
   - 의존성: @tanstack/react-query, apiClient

7. **campaigns/hooks/useCloseCampaign.ts (신규)**
   - 위치: `src/features/campaigns/hooks/useCloseCampaign.ts`
   - 설명: React Query mutation hook for PATCH /api/campaigns/:id/close
   - 의존성: @tanstack/react-query, apiClient

8. **campaigns/hooks/useSelectApplicants.ts (신규)**
   - 위치: `src/features/campaigns/hooks/useSelectApplicants.ts`
   - 설명: React Query mutation hook for POST /api/campaigns/:id/select
   - 의존성: @tanstack/react-query, apiClient

#### UI Components
9. **campaigns/components/advertiser-campaign-detail-view.tsx (신규)**
   - 위치: `src/features/campaigns/components/advertiser-campaign-detail-view.tsx`
   - 설명: 광고주용 체험단 상세 페이지 (지원자 테이블 포함)
   - 의존성: Card, Table, Badge, Button

10. **campaigns/components/applicants-table.tsx (신규)**
    - 위치: `src/features/campaigns/components/applicants-table.tsx`
    - 설명: 지원자 목록 테이블 (이름, 각오, 방문일, 상태)
    - 의존성: Table, Badge

11. **campaigns/components/close-campaign-dialog.tsx (신규)**
    - 위치: `src/features/campaigns/components/close-campaign-dialog.tsx`
    - 설명: 모집 종료 확인 Dialog
    - 의존성: Dialog, Button

12. **campaigns/components/select-applicants-dialog.tsx (신규)**
    - 위치: `src/features/campaigns/components/select-applicants-dialog.tsx`
    - 설명: 체험단 선정 Dialog (체크박스 선택)
    - 의존성: Dialog, Checkbox, Button

13. **campaigns/components/campaign-status-actions.tsx (신규)**
    - 위치: `src/features/campaigns/components/campaign-status-actions.tsx`
    - 설명: 상태별 액션 버튼 (모집 종료/체험단 선정)
    - 의존성: Button, hooks

#### Page
14. **/campaigns/manage/[id]/page.tsx (신규)**
    - 위치: `src/app/campaigns/manage/[id]/page.tsx`
    - 설명: 광고주 체험단 상세 관리 페이지 (권한 가드)
    - 의존성: useCurrentUser, useAdvertiserCampaignDetail, components

### 재사용 모듈
- `@/features/campaigns/components/campaign-status-badge`: 상태 뱃지 재사용
- `@/features/applications/backend/schema`: ApplicationStatus enum 재사용
- `@/lib/remote/api-client`: HTTP 클라이언트
- `@/features/auth/hooks/useCurrentUser`: 인증 상태 확인
- `@/components/ui/table`: shadcn Table 컴포넌트
- `@/components/ui/dialog`: shadcn Dialog 컴포넌트
- `@/components/ui/checkbox`: shadcn Checkbox 컴포넌트

---

## Diagram

```mermaid
graph TB
    subgraph "Page Layer"
        P[campaigns/manage/[id]/page.tsx]
    end

    subgraph "Component Layer"
        C1[AdvertiserCampaignDetailView]
        C2[ApplicantsTable]
        C3[CloseCampaignDialog]
        C4[SelectApplicantsDialog]
        C5[CampaignStatusActions]
        C6[CampaignStatusBadge - 재사용]
    end

    subgraph "Hook Layer"
        H1[useAdvertiserCampaignDetail]
        H2[useCloseCampaign]
        H3[useSelectApplicants]
        H4[useCurrentUser - 재사용]
    end

    subgraph "API Layer"
        A1[GET /api/campaigns/my/:id]
        A2[PATCH /api/campaigns/:id/close]
        A3[POST /api/campaigns/:id/select]
        A4[apiClient]
    end

    subgraph "Backend Layer"
        B1[route.ts - GET/PATCH/POST handlers]
        B2[service.ts - getAdvertiserCampaignDetail, closeCampaign, selectApplicants]
        B3[schema.ts - AdvertiserCampaignDetailResponse, CloseRequest, SelectRequest]
        B4[error.ts - Error codes]
    end

    subgraph "Database"
        DB[(Supabase)]
    end

    P --> C1
    P --> H1
    P --> H4

    C1 --> C2
    C1 --> C5
    C1 --> C6
    C5 --> C3
    C5 --> C4

    C3 --> H2
    C4 --> H3

    H1 --> A4
    H2 --> A4
    H3 --> A4
    A4 --> A1
    A4 --> A2
    A4 --> A3

    A1 --> B1
    A2 --> B1
    A3 --> B1
    B1 --> B2
    B1 --> B3
    B1 --> B4
    B2 --> DB

    style P fill:#e1f5ff
    style H1 fill:#fff4e1
    style H2 fill:#fff4e1
    style H3 fill:#fff4e1
    style A1 fill:#ffe1e1
    style A2 fill:#ffe1e1
    style A3 fill:#ffe1e1
    style B2 fill:#e1ffe1
```

---

## Implementation Plan

### Phase 1: Backend - Error Codes 확장

**파일**: `src/features/campaigns/backend/error.ts`

**추가 내용**:
```typescript
export const campaignErrorCodes = {
  // ... 기존 코드
  invalidStatus: 'INVALID_CAMPAIGN_STATUS',
  closureError: 'CAMPAIGN_CLOSURE_ERROR',
  selectionError: 'APPLICANT_SELECTION_ERROR',
  insufficientApplicants: 'INSUFFICIENT_APPLICANTS',
  exceedsRecruitmentCount: 'EXCEEDS_RECRUITMENT_COUNT',
} as const;
```

---

### Phase 2: Backend - Schema 확장

**파일**: `src/features/campaigns/backend/schema.ts`

**추가 내용**:
```typescript
// Applicant with user info schema
export const ApplicantSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  user_name: z.string(),
  message: z.string(),
  visit_date: z.string(),
  status: z.enum(['pending', 'selected', 'rejected']),
  created_at: z.string(),
});

export type Applicant = z.infer<typeof ApplicantSchema>;

// GET /api/campaigns/my/:id - Response schema (with applicants)
export const AdvertiserCampaignDetailResponseSchema = z.object({
  campaign: AdvertiserCampaignSchema,
  applicants: z.array(ApplicantSchema),
});

export type AdvertiserCampaignDetailResponse = z.infer<typeof AdvertiserCampaignDetailResponseSchema>;

// PATCH /api/campaigns/:id/close - Response schema
export const CloseCampaignResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
  updated_at: z.string(),
});

export type CloseCampaignResponse = z.infer<typeof CloseCampaignResponseSchema>;

// POST /api/campaigns/:id/select - Request schema
export const SelectApplicantsSchema = z.object({
  selected_ids: z.array(z.string().uuid()).min(1, '최소 1명 이상 선정해야 합니다.'),
});

export type SelectApplicantsRequest = z.infer<typeof SelectApplicantsSchema>;

// POST /api/campaigns/:id/select - Response schema
export const SelectApplicantsResponseSchema = z.object({
  selected_count: z.number(),
  rejected_count: z.number(),
  campaign_status: z.string(),
});

export type SelectApplicantsResponse = z.infer<typeof SelectApplicantsResponseSchema>;
```

**Unit Tests**:
```typescript
describe('SelectApplicantsSchema', () => {
  it('should require at least 1 selected ID', () => {
    const result = SelectApplicantsSchema.safeParse({ selected_ids: [] });
    expect(result.success).toBe(false);
  });

  it('should validate array of UUIDs', () => {
    const result = SelectApplicantsSchema.safeParse({
      selected_ids: ['123', 'invalid-uuid'],
    });
    expect(result.success).toBe(false);
  });

  it('should accept valid UUIDs', () => {
    const result = SelectApplicantsSchema.safeParse({
      selected_ids: ['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'],
    });
    expect(result.success).toBe(true);
  });
});
```

---

### Phase 3: Backend - Service Layer

**파일**: `src/features/campaigns/backend/service.ts`

**추가 내용**:
```typescript
/**
 * 광고주용 체험단 상세 조회 (지원자 포함)
 */
export const getAdvertiserCampaignDetail = async (
  client: SupabaseClient,
  campaignId: string,
  advertiserId: string,
): Promise<HandlerResult<AdvertiserCampaignDetailResponse, CampaignServiceError, unknown>> => {
  try {
    // 1. 체험단 정보 조회 (권한 확인 포함)
    const { data: campaign, error: campaignError } = await client
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('advertiser_id', advertiserId)
      .single();

    if (campaignError || !campaign) {
      return failure(404, campaignErrorCodes.notFound, '체험단을 찾을 수 없습니다.');
    }

    // 2. 지원자 목록 조회
    const { data: applications, error: applicationsError } = await client
      .from('applications')
      .select(`
        id,
        user_id,
        message,
        visit_date,
        status,
        created_at,
        users!inner(name)
      `)
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (applicationsError) {
      console.error('Applications fetch error:', applicationsError);
      return failure(500, campaignErrorCodes.databaseError, '지원자 목록 조회 실패');
    }

    // 3. 응답 포맷팅
    const applicants = (applications || []).map((app: any) => ({
      id: app.id,
      user_id: app.user_id,
      user_name: app.users.name,
      message: app.message,
      visit_date: app.visit_date,
      status: app.status,
      created_at: app.created_at,
    }));

    return success({
      campaign: {
        ...campaign,
        applications_count: applicants.length,
      },
      applicants,
    });
  } catch (error) {
    console.error('Unexpected error in getAdvertiserCampaignDetail:', error);
    return failure(500, campaignErrorCodes.databaseError, '예상치 못한 오류가 발생했습니다.', error);
  }
};

/**
 * 모집 종료
 */
export const closeCampaign = async (
  client: SupabaseClient,
  campaignId: string,
  advertiserId: string,
): Promise<HandlerResult<CloseCampaignResponse, CampaignServiceError, unknown>> => {
  try {
    // 1. 권한 및 상태 확인
    const { data: campaign, error: fetchError } = await client
      .from('campaigns')
      .select('status, advertiser_id')
      .eq('id', campaignId)
      .single();

    if (fetchError || !campaign) {
      return failure(404, campaignErrorCodes.notFound, '체험단을 찾을 수 없습니다.');
    }

    if (campaign.advertiser_id !== advertiserId) {
      return failure(403, campaignErrorCodes.forbidden, '권한이 없습니다.');
    }

    if (campaign.status !== 'recruiting') {
      return failure(400, campaignErrorCodes.invalidStatus, '모집 중 상태에서만 종료할 수 있습니다.');
    }

    // 2. 상태 변경
    const { data: updated, error: updateError } = await client
      .from('campaigns')
      .update({ status: 'closed', updated_at: new Date().toISOString() })
      .eq('id', campaignId)
      .select('id, status, updated_at')
      .single();

    if (updateError || !updated) {
      return failure(500, campaignErrorCodes.closureError, '모집 종료 처리 중 오류가 발생했습니다.');
    }

    return success(updated);
  } catch (error) {
    console.error('Unexpected error in closeCampaign:', error);
    return failure(500, campaignErrorCodes.databaseError, '예상치 못한 오류가 발생했습니다.', error);
  }
};

/**
 * 체험단 선정
 */
export const selectApplicants = async (
  client: SupabaseClient,
  campaignId: string,
  advertiserId: string,
  selectedIds: string[],
): Promise<HandlerResult<SelectApplicantsResponse, CampaignServiceError, unknown>> => {
  try {
    // 1. 권한 및 상태 확인
    const { data: campaign, error: fetchError } = await client
      .from('campaigns')
      .select('status, advertiser_id, recruitment_count')
      .eq('id', campaignId)
      .single();

    if (fetchError || !campaign) {
      return failure(404, campaignErrorCodes.notFound, '체험단을 찾을 수 없습니다.');
    }

    if (campaign.advertiser_id !== advertiserId) {
      return failure(403, campaignErrorCodes.forbidden, '권한이 없습니다.');
    }

    if (campaign.status !== 'closed') {
      return failure(400, campaignErrorCodes.invalidStatus, '모집 종료 상태에서만 선정할 수 있습니다.');
    }

    if (selectedIds.length > campaign.recruitment_count) {
      return failure(
        400,
        campaignErrorCodes.exceedsRecruitmentCount,
        `최대 ${campaign.recruitment_count}명까지만 선정 가능합니다.`,
      );
    }

    // 2. 트랜잭션으로 선정 처리
    const { error: txError } = await client.rpc('select_applicants_tx', {
      p_campaign_id: campaignId,
      p_selected_ids: selectedIds,
    });

    if (txError) {
      console.error('Transaction error:', txError);

      // RPC 함수가 없을 경우 직접 처리
      const { error: selectedError } = await client
        .from('applications')
        .update({ status: 'selected' })
        .eq('campaign_id', campaignId)
        .in('id', selectedIds);

      if (selectedError) {
        return failure(500, campaignErrorCodes.selectionError, '선정 처리 중 오류가 발생했습니다.');
      }

      const { error: rejectedError } = await client
        .from('applications')
        .update({ status: 'rejected' })
        .eq('campaign_id', campaignId)
        .eq('status', 'pending')
        .not('id', 'in', `(${selectedIds.join(',')})`);

      if (rejectedError) {
        console.error('Reject error:', rejectedError);
      }

      const { error: statusError } = await client
        .from('campaigns')
        .update({ status: 'completed' })
        .eq('id', campaignId);

      if (statusError) {
        console.error('Status update error:', statusError);
      }
    }

    // 3. 선정/반려 카운트 조회
    const { data: counts } = await client
      .from('applications')
      .select('status')
      .eq('campaign_id', campaignId);

    const selectedCount = counts?.filter((a) => a.status === 'selected').length || 0;
    const rejectedCount = counts?.filter((a) => a.status === 'rejected').length || 0;

    return success({
      selected_count: selectedCount,
      rejected_count: rejectedCount,
      campaign_status: 'completed',
    });
  } catch (error) {
    console.error('Unexpected error in selectApplicants:', error);
    return failure(500, campaignErrorCodes.databaseError, '예상치 못한 오류가 발생했습니다.', error);
  }
};
```

**Unit Tests**:
```typescript
describe('getAdvertiserCampaignDetail', () => {
  it('should return campaign with applicants', async () => {
    const mockClient = createMockSupabaseClient({
      campaign: { id: 'c1', advertiser_id: 'adv1', title: 'Test', status: 'recruiting' },
      applications: [
        { id: 'a1', user_id: 'u1', message: 'Test', users: { name: 'User 1' } },
      ],
    });

    const result = await getAdvertiserCampaignDetail(mockClient, 'c1', 'adv1');

    expect(result.ok).toBe(true);
    expect(result.data?.campaign.id).toBe('c1');
    expect(result.data?.applicants).toHaveLength(1);
  });

  it('should reject access from other advertiser', async () => {
    const mockClient = createMockSupabaseClient({
      campaign: { id: 'c1', advertiser_id: 'adv1' },
    });

    const result = await getAdvertiserCampaignDetail(mockClient, 'c1', 'adv2');

    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe(campaignErrorCodes.notFound);
  });
});

describe('closeCampaign', () => {
  it('should close recruiting campaign', async () => {
    const mockClient = createMockSupabaseClient({
      campaign: { id: 'c1', advertiser_id: 'adv1', status: 'recruiting' },
    });

    const result = await closeCampaign(mockClient, 'c1', 'adv1');

    expect(result.ok).toBe(true);
    expect(result.data?.status).toBe('closed');
  });

  it('should reject if already closed', async () => {
    const mockClient = createMockSupabaseClient({
      campaign: { id: 'c1', advertiser_id: 'adv1', status: 'closed' },
    });

    const result = await closeCampaign(mockClient, 'c1', 'adv1');

    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe(campaignErrorCodes.invalidStatus);
  });
});

describe('selectApplicants', () => {
  it('should select applicants and reject others', async () => {
    const mockClient = createMockSupabaseClient({
      campaign: { id: 'c1', advertiser_id: 'adv1', status: 'closed', recruitment_count: 10 },
    });

    const result = await selectApplicants(mockClient, 'c1', 'adv1', ['a1', 'a2']);

    expect(result.ok).toBe(true);
    expect(result.data?.selected_count).toBeGreaterThan(0);
  });

  it('should reject if exceeds recruitment count', async () => {
    const mockClient = createMockSupabaseClient({
      campaign: { id: 'c1', advertiser_id: 'adv1', status: 'closed', recruitment_count: 2 },
    });

    const result = await selectApplicants(mockClient, 'c1', 'adv1', ['a1', 'a2', 'a3']);

    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe(campaignErrorCodes.exceedsRecruitmentCount);
  });
});
```

---

### Phase 4: Backend - Route Handlers

**파일**: `src/features/campaigns/backend/route.ts`

**추가 내용**:
```typescript
/**
 * GET /api/campaigns/my/:id
 * 광고주용 체험단 상세 조회 (지원자 포함)
 */
app.get('/campaigns/my/:id', async (c) => {
  try {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const { id } = c.req.param();

    // 1. 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return respond(c, failure(401, campaignErrorCodes.unauthorized, '로그인이 필요합니다.'));
    }

    // 2. 광고주 프로필 확인
    const { data: userMetadata } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', user.id)
      .single();

    if (!userMetadata || userMetadata.role !== 'advertiser') {
      return respond(c, failure(403, campaignErrorCodes.forbidden, '광고주만 접근 가능합니다.'));
    }

    const { data: advertiser } = await supabase
      .from('advertiser_profiles')
      .select('id')
      .eq('user_id', userMetadata.id)
      .single();

    if (!advertiser) {
      return respond(c, failure(403, campaignErrorCodes.advertiserNotFound, '광고주 프로필이 필요합니다.'));
    }

    // 3. 체험단 상세 조회
    logger.info('Fetching advertiser campaign detail', { campaignId: id, advertiserId: advertiser.id });
    const result = await getAdvertiserCampaignDetail(supabase, id, advertiser.id);

    return respond(c, result);
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Unexpected error in GET /campaigns/my/:id', { error });
    throw error;
  }
});

/**
 * PATCH /api/campaigns/:id/close
 * 모집 종료
 */
app.patch('/campaigns/:id/close', async (c) => {
  try {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const { id } = c.req.param();

    // 인증 및 권한 확인 (동일)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return respond(c, failure(401, campaignErrorCodes.unauthorized, '로그인이 필요합니다.'));
    }

    const { data: userMetadata } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', user.id)
      .single();

    if (!userMetadata || userMetadata.role !== 'advertiser') {
      return respond(c, failure(403, campaignErrorCodes.forbidden, '광고주만 접근 가능합니다.'));
    }

    const { data: advertiser } = await supabase
      .from('advertiser_profiles')
      .select('id')
      .eq('user_id', userMetadata.id)
      .single();

    if (!advertiser) {
      return respond(c, failure(403, campaignErrorCodes.advertiserNotFound, '광고주 프로필이 필요합니다.'));
    }

    // 모집 종료
    logger.info('Closing campaign', { campaignId: id, advertiserId: advertiser.id });
    const result = await closeCampaign(supabase, id, advertiser.id);

    return respond(c, result);
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Unexpected error in PATCH /campaigns/:id/close', { error });
    throw error;
  }
});

/**
 * POST /api/campaigns/:id/select
 * 체험단 선정
 */
app.post('/campaigns/:id/select', async (c) => {
  try {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const { id } = c.req.param();

    // 인증 및 권한 확인 (동일)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return respond(c, failure(401, campaignErrorCodes.unauthorized, '로그인이 필요합니다.'));
    }

    const { data: userMetadata } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_user_id', user.id)
      .single();

    if (!userMetadata || userMetadata.role !== 'advertiser') {
      return respond(c, failure(403, campaignErrorCodes.forbidden, '광고주만 접근 가능합니다.'));
    }

    const { data: advertiser } = await supabase
      .from('advertiser_profiles')
      .select('id')
      .eq('user_id', userMetadata.id)
      .single();

    if (!advertiser) {
      return respond(c, failure(403, campaignErrorCodes.advertiserNotFound, '광고주 프로필이 필요합니다.'));
    }

    // 요청 바디 검증
    const body = await c.req.json();
    const parsedBody = SelectApplicantsSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(400, campaignErrorCodes.invalidInput, '잘못된 입력값입니다.', parsedBody.error.format()),
      );
    }

    // 체험단 선정
    logger.info('Selecting applicants', {
      campaignId: id,
      advertiserId: advertiser.id,
      selectedCount: parsedBody.data.selected_ids.length,
    });
    const result = await selectApplicants(supabase, id, advertiser.id, parsedBody.data.selected_ids);

    return respond(c, result);
  } catch (error) {
    const logger = getLogger(c);
    logger.error('Unexpected error in POST /campaigns/:id/select', { error });
    throw error;
  }
});
```

---

### Phase 5: Frontend Data Layer

**파일**: `src/features/campaigns/lib/dto.ts` (확장)
```typescript
export {
  // ... 기존 export
  ApplicantSchema,
  AdvertiserCampaignDetailResponseSchema,
  CloseCampaignResponseSchema,
  SelectApplicantsSchema,
  SelectApplicantsResponseSchema,
  type Applicant,
  type AdvertiserCampaignDetailResponse,
  type CloseCampaignResponse,
  type SelectApplicantsRequest,
  type SelectApplicantsResponse,
} from '../backend/schema';
```

**파일**: `src/features/campaigns/hooks/useAdvertiserCampaignDetail.ts` (신규)
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { AdvertiserCampaignDetailResponse } from '../lib/dto';

const fetchAdvertiserCampaignDetail = async (campaignId: string): Promise<AdvertiserCampaignDetailResponse> => {
  const response = await apiClient.get<AdvertiserCampaignDetailResponse>(`/campaigns/my/${campaignId}`);

  if (!response.data) {
    throw new Error('체험단 상세 조회에 실패했습니다.');
  }

  return response.data;
};

export const useAdvertiserCampaignDetail = (campaignId: string) => {
  return useQuery({
    queryKey: ['advertiser-campaign-detail', campaignId],
    queryFn: () => fetchAdvertiserCampaignDetail(campaignId),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    enabled: !!campaignId,
  });
};
```

**파일**: `src/features/campaigns/hooks/useCloseCampaign.ts` (신규)
```typescript
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { CloseCampaignResponse } from '../lib/dto';

const closeCampaign = async (campaignId: string): Promise<CloseCampaignResponse> => {
  const response = await apiClient.patch<CloseCampaignResponse>(`/campaigns/${campaignId}/close`);

  if (!response.data) {
    throw new Error('모집 종료에 실패했습니다.');
  }

  return response.data;
};

export const useCloseCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: closeCampaign,
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['advertiser-campaign-detail', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['advertiser-campaigns'] });
    },
    retry: false,
  });
};
```

**파일**: `src/features/campaigns/hooks/useSelectApplicants.ts` (신규)
```typescript
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { SelectApplicantsRequest, SelectApplicantsResponse } from '../lib/dto';

const selectApplicants = async (
  campaignId: string,
  data: SelectApplicantsRequest,
): Promise<SelectApplicantsResponse> => {
  const response = await apiClient.post<SelectApplicantsResponse>(`/campaigns/${campaignId}/select`, data);

  if (!response.data) {
    throw new Error('체험단 선정에 실패했습니다.');
  }

  return response.data;
};

export const useSelectApplicants = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: SelectApplicantsRequest }) =>
      selectApplicants(campaignId, data),
    onSuccess: (_, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['advertiser-campaign-detail', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['advertiser-campaigns'] });
    },
    retry: false,
  });
};
```

---

### Phase 6: UI Components

#### 6-1. ApplicantsTable

**파일**: `src/features/campaigns/components/applicants-table.tsx`

**QA Sheet**:
- [ ] 테이블 헤더: 이름, 각오 한마디, 방문 예정일, 지원일, 상태
- [ ] 각 행에 지원자 정보 표시
- [ ] 상태 뱃지 (대기중/선정/반려)
- [ ] 빈 상태: "아직 지원자가 없습니다"
- [ ] 반응형 레이아웃 (모바일에서는 스크롤)
- [ ] 정렬: 지원일시 최신순

#### 6-2. CloseCampaignDialog

**파일**: `src/features/campaigns/components/close-campaign-dialog.tsx`

**QA Sheet**:
- [ ] Dialog 열기/닫기
- [ ] 제목: "모집을 종료하시겠습니까?"
- [ ] 설명: "모집 종료 후에는 되돌릴 수 없습니다"
- [ ] "취소" 버튼
- [ ] "종료" 버튼 (빨간색)
- [ ] 종료 중 로딩 상태
- [ ] 종료 성공 시 Dialog 닫기
- [ ] 종료 실패 시 에러 메시지

#### 6-3. SelectApplicantsDialog

**파일**: `src/features/campaigns/components/select-applicants-dialog.tsx`

**QA Sheet**:
- [ ] Dialog 열기/닫기
- [ ] 제목: "체험단 선정"
- [ ] 지원자 목록 (체크박스)
- [ ] 선정 인원 카운터 (N / 최대 모집인원)
- [ ] 전체 선택/해제 체크박스
- [ ] 모집 인원 초과 시 에러 메시지
- [ ] "취소" 버튼
- [ ] "선정 완료" 버튼
- [ ] 선정 중 로딩 상태
- [ ] 선정 성공 시 Dialog 닫기 + 성공 메시지
- [ ] 선정 실패 시 에러 메시지

#### 6-4. CampaignStatusActions

**파일**: `src/features/campaigns/components/campaign-status-actions.tsx`

**QA Sheet**:
- [ ] 상태에 따른 버튼 표시
  - recruiting → "모집 종료" 버튼
  - closed → "체험단 선정" 버튼
  - completed → 버튼 없음 (완료 메시지)
- [ ] 버튼 클릭 시 해당 Dialog 열기
- [ ] 지원자 0명일 때 "체험단 선정" 비활성화

#### 6-5. AdvertiserCampaignDetailView

**파일**: `src/features/campaigns/components/advertiser-campaign-detail-view.tsx`

**QA Sheet**:
- [ ] 체험단 정보 섹션 (제목, 설명, 혜택, 미션, 매장 정보)
- [ ] 모집 정보 섹션 (모집 기간, 모집 인원, 지원 현황)
- [ ] 상태 뱃지
- [ ] 액션 버튼 영역 (CampaignStatusActions)
- [ ] 지원자 목록 섹션 (ApplicantsTable)
- [ ] 반응형 레이아웃

---

### Phase 7: Page Integration

**파일**: `src/app/campaigns/manage/[id]/page.tsx`

**QA Sheet**:
- [ ] 페이지 제목: "체험단 관리 - [체험단 제목]"
- [ ] 비로그인 시 로그인 페이지 리다이렉트
- [ ] 인플루언서 접근 시 홈 리다이렉트
- [ ] 다른 광고주 체험단 접근 시 404
- [ ] 로딩 중 스켈레톤
- [ ] 에러 시 에러 메시지
- [ ] 상세 뷰 렌더링
- [ ] "목록으로" 버튼
- [ ] 모집 종료 성공 시 UI 갱신
- [ ] 선정 완료 성공 시 UI 갱신

---

## Implementation Order

1. **Phase 1**: Backend Error Codes 확장
2. **Phase 2**: Backend Schema 확장
3. **Phase 3**: Backend Service Layer
4. **Phase 4**: Backend Route Handlers
5. **Phase 5**: Frontend Data Layer (DTO + Hooks)
6. **Phase 6**: UI Components (Table → Dialogs → Actions → View)
7. **Phase 7**: Page Integration
8. **Verification**: Type check, Build, Manual QA

---

## Testing Strategy

### Backend
- Unit tests for schema validation
- Unit tests for service layer (권한, 상태, 트랜잭션)
- Integration tests for PATCH/POST routes

### Frontend
- Component QA sheets
- Page-level QA sheet
- Manual testing for auth/role guards
- 상태 전환 시나리오 테스트

---

## Notes

- **트랜잭션**: 체험단 선정 시 applications 업데이트와 campaign 상태 변경을 트랜잭션으로 처리
- **권한 검증**: 모든 엔드포인트에서 광고주 권한 및 소유권 확인
- **상태 관리**: React Query로 캐싱, invalidation 관리
- **에러 처리**: 명확한 에러 메시지 및 사용자 피드백
- **접근성**: 키보드 네비게이션, aria-label, semantic HTML
- **재사용**: CampaignStatusBadge, Table 컴포넌트 재사용
