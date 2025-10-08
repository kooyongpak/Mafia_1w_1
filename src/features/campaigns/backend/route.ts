import type { Hono } from 'hono';
import { failure, respond, type ErrorResult } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import { GetCampaignsQuerySchema } from './schema';
import { getCampaigns } from './service';
import { type CampaignServiceError } from './error';

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
};

