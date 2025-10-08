import { z } from 'zod';
import { CAMPAIGN_STATUS, CAMPAIGN_SORT, PAGINATION_DEFAULTS } from '@/constants/campaigns';

export const GetCampaignsQuerySchema = z.object({
  status: z
    .enum(['recruiting', 'closed', 'completed'] as const)
    .optional()
    .default('recruiting' as const),
  category: z.string().optional(),
  page: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .default(PAGINATION_DEFAULTS.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(PAGINATION_DEFAULTS.MAX_LIMIT)
    .optional()
    .default(PAGINATION_DEFAULTS.DEFAULT_LIMIT),
  sort: z
    .enum(['latest', 'deadline', 'popular'] as const)
    .optional()
    .default('latest' as const),
});

export type GetCampaignsQuery = z.infer<typeof GetCampaignsQuerySchema>;

export const CampaignWithAdvertiserSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  benefits: z.string(),
  recruitment_count: z.number(),
  recruitment_start_date: z.string(),
  recruitment_end_date: z.string(),
  status: z.string(),
  created_at: z.string(),
  advertiser: z.object({
    id: z.string().uuid(),
    company_name: z.string(),
    category: z.string(),
    location: z.string(),
  }),
  applications_count: z.number(),
});

export type CampaignWithAdvertiser = z.infer<typeof CampaignWithAdvertiserSchema>;

export const PaginationMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  total_pages: z.number(),
});

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

export const GetCampaignsResponseSchema = z.object({
  data: z.array(CampaignWithAdvertiserSchema),
  pagination: PaginationMetaSchema,
});

export type GetCampaignsResponse = z.infer<typeof GetCampaignsResponseSchema>;

