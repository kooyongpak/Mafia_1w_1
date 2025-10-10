import { Hono } from 'hono';
import { errorBoundary } from '@/backend/middleware/error';
import { withAppContext } from '@/backend/middleware/context';
import { withSupabase } from '@/backend/middleware/supabase';
import { registerExampleRoutes } from '@/features/example/backend/route';
import { registerSignupRoutes } from '@/features/signup/backend/route';
import { registerInfluencerProfileRoutes } from '@/features/influencer-profile/backend/route';
import { registerAdvertiserProfileRoutes } from '@/features/advertiser-profile/backend/route';
import { registerCampaignRoutes } from '@/features/campaigns/backend/route';
import { registerApplicationRoutes } from '@/features/applications/backend/route';
import type { AppEnv } from '@/backend/hono/context';

let singletonApp: Hono<AppEnv> | null = null;

export const createHonoApp = () => {
  if (singletonApp && process.env.NODE_ENV === 'production') {
    return singletonApp;
  }

  const app = new Hono<AppEnv>({ strict: false }).basePath('/api');

  app.use('*', errorBoundary());
  app.use('*', withAppContext());
  app.use('*', withSupabase());

  registerExampleRoutes(app);
  registerSignupRoutes(app);
  registerInfluencerProfileRoutes(app);
  registerAdvertiserProfileRoutes(app);
  registerCampaignRoutes(app);
  registerApplicationRoutes(app);

  console.log('Hono routes registered:', {
    exampleRoutes: true,
    signupRoutes: true,
    influencerProfileRoutes: true,
    advertiserProfileRoutes: true,
    campaignRoutes: true,
    applicationRoutes: true,
  });

  if (process.env.NODE_ENV === 'production') {
    singletonApp = app;
  }

  return app;
};
