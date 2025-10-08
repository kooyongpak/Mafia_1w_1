import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import { SignupRequestSchema } from './schema';
import { createUserAccount } from './service';
import { type SignupServiceError } from './error';

export const registerSignupRoutes = (app: Hono<AppEnv>) => {
  app.post('/signup', async (c) => {
    const body = await c.req.json();
    const parsedBody = SignupRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_SIGNUP_REQUEST',
          '입력값이 올바르지 않습니다.',
          parsedBody.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await createUserAccount(supabase, parsedBody.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<SignupServiceError, unknown>;
      logger.error('Signup failed', { error: errorResult.error.code });
    } else {
      logger.info('User signed up successfully', { userId: result.data.userId });
    }

    return respond(c, result);
  });
};
