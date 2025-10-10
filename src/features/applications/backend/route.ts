import type { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { respond, failure } from '@/backend/http/response';
import { applicationErrorCodes } from './error';
import { CreateApplicationSchema, GetApplicationsQuerySchema } from './schema';
import { createApplication, getUserApplications } from './service';

export const registerApplicationRoutes = (app: Hono<AppEnv>) => {
  /**
   * POST /api/applications
   * 체험단 지원서 생성
   *
   * @requires Authentication
   * @requires Role: influencer
   * @body { campaign_id: string, message: string, visit_date: string }
   * @returns 201 Created with application data
   */
  app.post('/applications', async (c) => {
    try {
      // 1. Get Supabase client from context
      const supabase = c.get('supabase');

      // 2. Get authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return respond(
          c,
          failure(401, applicationErrorCodes.unauthorized, '로그인이 필요합니다.'),
        );
      }

      // 3. Check user role (influencer only)
      const { data: userMetadata } = await supabase
        .from('users')
        .select('id, role')
        .eq('auth_user_id', user.id)
        .single();

      if (!userMetadata || userMetadata.role !== 'influencer') {
        return respond(
          c,
          failure(403, applicationErrorCodes.forbidden, '인플루언서만 지원할 수 있습니다.'),
        );
      }

      // 4. Check if influencer profile exists
      const { data: profile } = await supabase
        .from('influencer_profiles')
        .select('id')
        .eq('user_id', userMetadata.id)
        .single();

      if (!profile) {
        return respond(
          c,
          failure(
            403,
            applicationErrorCodes.profileNotFound,
            '인플루언서 프로필을 먼저 등록해주세요.',
          ),
        );
      }

      // 5. Parse and validate request body
      const body = await c.req.json();
      const parsedBody = CreateApplicationSchema.safeParse(body);

      if (!parsedBody.success) {
        return respond(
          c,
          failure(
            400,
            applicationErrorCodes.invalidInput,
            '잘못된 입력값입니다.',
            parsedBody.error.format(),
          ),
        );
      }

      // 6. Create application
      const result = await createApplication(supabase, userMetadata.id, parsedBody.data);

      // 7. Return result
      return respond(c, result);
    } catch (error) {
      return respond(
        c,
        failure(
          500,
          applicationErrorCodes.databaseError,
          '지원서 생성 중 예상치 못한 오류가 발생했습니다.',
          error,
        ),
      );
    }
  });

  /**
   * GET /api/applications
   * 체험단 지원 목록 조회
   *
   * @requires Authentication
   * @requires Role: influencer
   * @query { status?: string, page?: number, limit?: number }
   * @returns 200 OK with applications list
   */
  app.get('/applications', async (c) => {
    try {
      const supabase = c.get('supabase');

      // 1. Get authenticated user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return respond(
          c,
          failure(401, applicationErrorCodes.unauthorized, '로그인이 필요합니다.'),
        );
      }

      // 2. Check user role (influencer only)
      const { data: userMetadata } = await supabase
        .from('users')
        .select('id, role')
        .eq('auth_user_id', user.id)
        .single();

      if (!userMetadata || userMetadata.role !== 'influencer') {
        return respond(
          c,
          failure(403, applicationErrorCodes.forbidden, '인플루언서만 접근 가능합니다.'),
        );
      }

      // 3. Check influencer profile
      const { data: profile } = await supabase
        .from('influencer_profiles')
        .select('id')
        .eq('user_id', userMetadata.id)
        .single();

      if (!profile) {
        return respond(
          c,
          failure(
            403,
            applicationErrorCodes.profileNotFound,
            '프로필을 먼저 등록해주세요.',
          ),
        );
      }

      // 4. Parse query params
      const queryParams = c.req.query();
      const parsedQuery = GetApplicationsQuerySchema.safeParse(queryParams);

      if (!parsedQuery.success) {
        return respond(
          c,
          failure(
            400,
            applicationErrorCodes.invalidInput,
            '잘못된 쿼리 파라미터입니다.',
            parsedQuery.error.format(),
          ),
        );
      }

      // 5. Fetch applications
      const result = await getUserApplications(supabase, userMetadata.id, parsedQuery.data);

      return respond(c, result);
    } catch (error) {
      return respond(
        c,
        failure(
          500,
          applicationErrorCodes.databaseError,
          '예상치 못한 오류가 발생했습니다.',
          error,
        ),
      );
    }
  });
};
