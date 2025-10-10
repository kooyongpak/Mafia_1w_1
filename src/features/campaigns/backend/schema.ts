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

export const GetCampaignDetailParamsSchema = z.object({
  id: z.string().uuid(),
});

export type GetCampaignDetailParams = z.infer<typeof GetCampaignDetailParamsSchema>;

export const CampaignDetailSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  benefits: z.string(),
  mission: z.string(),
  store_info: z.string(),
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

export type CampaignDetail = z.infer<typeof CampaignDetailSchema>;

export const CheckApplicationQuerySchema = z.object({
  campaign_id: z.string().uuid(),
  user_id: z.string().uuid(),
});

export type CheckApplicationQuery = z.infer<typeof CheckApplicationQuerySchema>;

export const ApplicationInfoSchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
  created_at: z.string(),
});

export type ApplicationInfo = z.infer<typeof ApplicationInfoSchema>;

export const CheckApplicationResponseSchema = z.object({
  applied: z.boolean(),
  application: ApplicationInfoSchema.nullable(),
});

export type CheckApplicationResponse = z.infer<typeof CheckApplicationResponseSchema>;

export const CreateCampaignSchema = z.object({
  title: z.string().min(5, '제목은 5자 이상이어야 합니다.').max(100, '제목은 100자 이하여야 합니다.'),
  description: z.string().max(2000, '설명은 2000자 이하여야 합니다.').optional(),
  benefits: z.string().min(10, '혜택은 10자 이상이어야 합니다.').max(500, '혜택은 500자 이하여야 합니다.'),
  mission: z.string().min(10, '미션은 10자 이상이어야 합니다.').max(1000, '미션은 1000자 이하여야 합니다.'),
  store_info: z.string().min(5, '매장 정보는 5자 이상이어야 합니다.').max(500, '매장 정보는 500자 이하여야 합니다.'),
  recruitment_count: z.number().int().min(1, '모집 인원은 1명 이상이어야 합니다.').max(1000, '모집 인원은 1000명 이하여야 합니다.'),
  recruitment_start_date: z.string().refine(
    (date) => {
      const startDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return startDate >= today;
    },
    { message: '시작일은 오늘 이후여야 합니다.' }
  ),
  recruitment_end_date: z.string(),
}).refine(
  (data) => {
    const start = new Date(data.recruitment_start_date);
    const end = new Date(data.recruitment_end_date);
    return end > start;
  },
  { message: '종료일은 시작일 이후여야 합니다.', path: ['recruitment_end_date'] }
).refine(
  (data) => {
    const start = new Date(data.recruitment_start_date);
    const end = new Date(data.recruitment_end_date);
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 90;
  },
  { message: '모집 기간은 최대 90일입니다.', path: ['recruitment_end_date'] }
);

export type CreateCampaignRequest = z.infer<typeof CreateCampaignSchema>;

export const CreateCampaignResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  status: z.string(),
  created_at: z.string(),
});

export type CreateCampaignResponse = z.infer<typeof CreateCampaignResponseSchema>;

export const GetAdvertiserCampaignsQuerySchema = z.object({
  status: z.enum(['recruiting', 'closed', 'completed'] as const).optional(),
  page: z.coerce.number().int().positive().optional().default(PAGINATION_DEFAULTS.DEFAULT_PAGE),
  limit: z.coerce.number().int().positive().max(PAGINATION_DEFAULTS.MAX_LIMIT).optional().default(PAGINATION_DEFAULTS.DEFAULT_LIMIT),
});

export type GetAdvertiserCampaignsQuery = z.infer<typeof GetAdvertiserCampaignsQuerySchema>;

export const AdvertiserCampaignSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  benefits: z.string(),
  mission: z.string(),
  store_info: z.string(),
  recruitment_count: z.number(),
  recruitment_start_date: z.string(),
  recruitment_end_date: z.string(),
  status: z.string(),
  created_at: z.string(),
  applications_count: z.number(),
});

export type AdvertiserCampaign = z.infer<typeof AdvertiserCampaignSchema>;

export const GetAdvertiserCampaignsResponseSchema = z.object({
  data: z.array(AdvertiserCampaignSchema),
  pagination: PaginationMetaSchema,
});

export type GetAdvertiserCampaignsResponse = z.infer<typeof GetAdvertiserCampaignsResponseSchema>;

