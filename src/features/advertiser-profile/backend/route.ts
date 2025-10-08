import type { Hono } from 'hono';
import { failure, respond, type ErrorResult } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import { CreateAdvertiserProfileRequestSchema } from './schema';
import { createAdvertiserProfile } from './service';
import { type AdvertiserProfileServiceError } from './error';

export const registerAdvertiserProfileRoutes = (app: Hono<AppEnv>) => {
  app.post('/advertiser/profile', async (c) => {
    const body = await c.req.json();
    const parsedBody = CreateAdvertiserProfileRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_ADVERTISER_PROFILE_REQUEST',
          '입력값이 올바르지 않습니다.',
          parsedBody.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await createAdvertiserProfile(supabase, parsedBody.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<AdvertiserProfileServiceError, unknown>;
      logger.error('Advertiser profile creation failed', { error: errorResult.error.code });
    } else {
      logger.info('Advertiser profile created successfully', { profileId: result.data.profileId });
    }

    return respond(c, result);
  });
};

