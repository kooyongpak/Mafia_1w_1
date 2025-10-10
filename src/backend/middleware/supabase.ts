import { createMiddleware } from 'hono/factory';
import {
  contextKeys,
  type AppEnv,
} from '@/backend/hono/context';
import { createServerClient } from '@/backend/supabase/client';

export const withSupabase = () =>
  createMiddleware<AppEnv>(async (c, next) => {
    const config = c.get(
      contextKeys.config,
    ) as AppEnv['Variables']['config'] | undefined;

    if (!config) {
      throw new Error('Application configuration is not available.');
    }

    // Use createServerClient instead of createServiceClient
    // This allows reading the auth session from cookies
    const client = createServerClient(config.supabase, c);

    c.set(contextKeys.supabase, client);

    await next();
  });
