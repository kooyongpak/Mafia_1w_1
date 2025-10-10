import type { Hono } from 'hono';
import { failure, respond, type ErrorResult } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import { GetCampaignsQuerySchema, GetCampaignDetailParamsSchema, CheckApplicationQuerySchema, CreateCampaignSchema, GetAdvertiserCampaignsQuerySchema } from './schema';
import { getCampaigns, getCampaignById, checkApplication, createCampaign, getAdvertiserCampaigns } from './service';
import { type CampaignServiceError, campaignErrorCodes } from './error';

export const registerCampaignRoutes = (app: Hono<AppEnv>) => {
  app.get('/campaigns', async (c) => {
    try {
      const queryParams = c.req.query();
      const logger = getLogger(c);

      logger.info('Campaigns request received', { queryParams });

      const parsedQuery = GetCampaignsQuerySchema.safeParse(queryParams);

      if (!parsedQuery.success) {
        logger.error('Query params validation failed', { error: parsedQuery.error });
        return respond(
          c,
          failure(
            400,
            'INVALID_CAMPAIGNS_QUERY',
            '잘못된 쿼리 파라미터입니다.',
            parsedQuery.error.format(),
          ),
        );
      }

      const supabase = getSupabase(c);
      const result = await getCampaigns(supabase, parsedQuery.data);

      if (!result.ok) {
        const errorResult = result as ErrorResult<CampaignServiceError, unknown>;
        logger.error('Campaigns fetch failed', {
          error: errorResult.error.code,
          message: errorResult.error.message,
          details: errorResult.error.details,
        });
      } else {
        logger.info('Campaigns fetched successfully', {
          count: result.data.data.length,
          page: result.data.pagination.page,
        });
      }

      return respond(c, result);
    } catch (error) {
      const logger = getLogger(c);
      logger.error('Unexpected error in campaigns route', { error });
      throw error;
    }
  });

  // IMPORTANT: /campaigns/my must come BEFORE /campaigns/:id
  app.get('/campaigns/my', async (c) => {
    try {
      const supabase = getSupabase(c);
      const logger = getLogger(c);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        logger.error('Auth check failed', { error: authError });
        return respond(c, failure(401, campaignErrorCodes.unauthorized, '로그인이 필요합니다.'));
      }

      const { data: userMetadata } = await supabase
        .from('users')
        .select('id, role')
        .eq('auth_user_id', user.id)
        .single();

      if (!userMetadata || userMetadata.role !== 'advertiser') {
        logger.error('Role check failed', { userId: user.id, role: userMetadata?.role });
        return respond(c, failure(403, campaignErrorCodes.forbidden, '광고주만 접근 가능합니다.'));
      }

      const { data: advertiser } = await supabase
        .from('advertiser_profiles')
        .select('id')
        .eq('user_id', userMetadata.id)
        .single();

      if (!advertiser) {
        logger.error('Advertiser profile not found', { userId: user.id });
        return respond(
          c,
          failure(403, campaignErrorCodes.advertiserNotFound, '광고주 프로필을 먼저 등록해주세요.'),
        );
      }

      const queryParams = c.req.query();
      const parsedQuery = GetAdvertiserCampaignsQuerySchema.safeParse(queryParams);

      if (!parsedQuery.success) {
        logger.error('Query params validation failed', { error: parsedQuery.error });
        return respond(
          c,
          failure(400, campaignErrorCodes.invalidInput, '잘못된 쿼리 파라미터입니다.', parsedQuery.error.format()),
        );
      }

      logger.info('Fetching advertiser campaigns', { advertiserId: advertiser.id, query: parsedQuery.data });

      const result = await getAdvertiserCampaigns(supabase, advertiser.id, parsedQuery.data);

      if (!result.ok) {
        const errorResult = result as ErrorResult<CampaignServiceError, unknown>;
        logger.error('Advertiser campaigns fetch failed', {
          error: errorResult.error.code,
          message: errorResult.error.message,
          details: errorResult.error.details,
        });
      } else {
        logger.info('Advertiser campaigns fetched successfully', {
          count: result.data.data.length,
          page: result.data.pagination.page,
        });
      }

      return respond(c, result);
    } catch (error) {
      const logger = getLogger(c);
      logger.error('Unexpected error in advertiser campaigns route', { error });
      throw error;
    }
  });

  app.get('/campaigns/:id', async (c) => {
    try {
      const params = c.req.param();
      const logger = getLogger(c);

      logger.info('Campaign detail request received', { params });

      const parsedParams = GetCampaignDetailParamsSchema.safeParse(params);

      if (!parsedParams.success) {
        logger.error('Path params validation failed', { error: parsedParams.error });
        return respond(
          c,
          failure(
            400,
            campaignErrorCodes.invalidCampaignId,
            '잘못된 체험단 ID입니다.',
            parsedParams.error.format(),
          ),
        );
      }

      const supabase = getSupabase(c);
      const result = await getCampaignById(supabase, parsedParams.data.id);

      if (!result.ok) {
        const errorResult = result as ErrorResult<CampaignServiceError, unknown>;
        logger.error('Campaign detail fetch failed', {
          error: errorResult.error.code,
          message: errorResult.error.message,
          details: errorResult.error.details,
        });
      } else {
        logger.info('Campaign detail fetched successfully', {
          campaignId: result.data.id,
        });
      }

      return respond(c, result);
    } catch (error) {
      const logger = getLogger(c);
      logger.error('Unexpected error in campaign detail route', { error });
      throw error;
    }
  });

  app.post('/campaigns', async (c) => {
    try {
      const supabase = getSupabase(c);
      const logger = getLogger(c);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        logger.error('Auth check failed', { error: authError });
        return respond(c, failure(401, campaignErrorCodes.unauthorized, '로그인이 필요합니다.'));
      }

      const { data: userMetadata } = await supabase
        .from('users')
        .select('id, role')
        .eq('auth_user_id', user.id)
        .single();

      if (!userMetadata || userMetadata.role !== 'advertiser') {
        logger.error('Role check failed', { userId: user.id, role: userMetadata?.role });
        return respond(c, failure(403, campaignErrorCodes.forbidden, '광고주만 접근 가능합니다.'));
      }

      const { data: advertiser } = await supabase
        .from('advertiser_profiles')
        .select('id')
        .eq('user_id', userMetadata.id)
        .single();

      if (!advertiser) {
        logger.error('Advertiser profile not found', { userId: user.id });
        return respond(
          c,
          failure(403, campaignErrorCodes.advertiserNotFound, '광고주 프로필을 먼저 등록해주세요.'),
        );
      }

      const body = await c.req.json();
      const parsedBody = CreateCampaignSchema.safeParse(body);

      if (!parsedBody.success) {
        logger.error('Request body validation failed', { error: parsedBody.error });
        return respond(
          c,
          failure(400, campaignErrorCodes.invalidInput, '잘못된 입력값입니다.', parsedBody.error.format()),
        );
      }

      logger.info('Creating campaign', { advertiserId: advertiser.id, data: parsedBody.data });

      const result = await createCampaign(supabase, advertiser.id, parsedBody.data);

      if (!result.ok) {
        const errorResult = result as ErrorResult<CampaignServiceError, unknown>;
        logger.error('Campaign creation failed', {
          error: errorResult.error.code,
          message: errorResult.error.message,
          details: errorResult.error.details,
        });
      } else {
        logger.info('Campaign created successfully', {
          campaignId: result.data.id,
        });
      }

      return respond(c, result);
    } catch (error) {
      const logger = getLogger(c);
      logger.error('Unexpected error in campaign creation route', { error });
      throw error;
    }
  });

  app.get('/applications/check', async (c) => {
    try {
      const queryParams = c.req.query();
      const logger = getLogger(c);

      logger.info('Application check request received', { queryParams });

      const parsedQuery = CheckApplicationQuerySchema.safeParse(queryParams);

      if (!parsedQuery.success) {
        logger.error('Query params validation failed', { error: parsedQuery.error });
        return respond(
          c,
          failure(
            400,
            campaignErrorCodes.invalidApplicationCheckQuery,
            '잘못된 쿼리 파라미터입니다.',
            parsedQuery.error.format(),
          ),
        );
      }

      const supabase = getSupabase(c);
      const result = await checkApplication(
        supabase,
        parsedQuery.data.campaign_id,
        parsedQuery.data.user_id,
      );

      if (!result.ok) {
        const errorResult = result as ErrorResult<CampaignServiceError, unknown>;
        logger.error('Application check failed', {
          error: errorResult.error.code,
          message: errorResult.error.message,
          details: errorResult.error.details,
        });
      } else {
        logger.info('Application check completed', {
          applied: result.data.applied,
        });
      }

      return respond(c, result);
    } catch (error) {
      const logger = getLogger(c);
      logger.error('Unexpected error in application check route', { error });
      throw error;
    }
  });
};

