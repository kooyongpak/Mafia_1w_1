import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerClient as createSSRServerClient } from '@supabase/ssr';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type { Context } from 'hono';

export type ServiceClientConfig = {
  url: string;
  serviceRoleKey: string;
};

export const createServiceClient = ({
  url,
  serviceRoleKey,
}: ServiceClientConfig): SupabaseClient =>
  createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });

/**
 * Creates a Supabase client that reads auth from cookies using @supabase/ssr
 * This is used for authenticated API routes that need to access the current user
 */
export const createServerClient = (
  config: ServiceClientConfig,
  context: Context,
) => {
  return createSSRServerClient(config.url, config.serviceRoleKey, {
    cookies: {
      get: (name: string) => {
        return getCookie(context, name);
      },
      set: (name: string, value: string, options: any) => {
        setCookie(context, name, value, options);
      },
      remove: (name: string, options: any) => {
        deleteCookie(context, name, options);
      },
    },
  });
};
