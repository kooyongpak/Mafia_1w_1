import type { Hono } from 'hono';
import { failure, respond, type ErrorResult } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import { CreateInfluencerProfileRequestSchema } from './schema';
import { createInfluencerProfile } from './service';
import { type InfluencerProfileServiceError } from './error';

export const registerInfluencerProfileRoutes = (app: Hono<AppEnv>) => {
  app.post('/influencer/profile', async (c) => {
    const body = await c.req.json();
    const parsedBody = CreateInfluencerProfileRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_INFLUENCER_PROFILE_REQUEST',
          '입력값이 올바르지 않습니다.',
          parsedBody.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await createInfluencerProfile(supabase, parsedBody.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<InfluencerProfileServiceError, unknown>;
      logger.error('Influencer profile creation failed', { error: errorResult.error.code });
    } else {
      logger.info('Influencer profile created successfully', { profileId: result.data.profileId });
    }

    return respond(c, result);
  });
};
