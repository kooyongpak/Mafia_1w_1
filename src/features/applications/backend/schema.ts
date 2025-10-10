import { z } from 'zod';

/**
 * Application status enum
 */
export const ApplicationStatusSchema = z.enum(['pending', 'selected', 'rejected']);

export type ApplicationStatus = z.infer<typeof ApplicationStatusSchema>;

/**
 * POST /api/applications - Request body schema
 */
export const CreateApplicationSchema = z.object({
  campaign_id: z.string().uuid({ message: '유효한 체험단 ID가 필요합니다.' }),
  message: z
    .string()
    .min(1, { message: '각오 한마디는 필수입니다.' })
    .max(500, { message: '각오 한마디는 500자 이하여야 합니다.' }),
  visit_date: z.string().refine(
    (date) => {
      const visitDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return visitDate >= today;
    },
    { message: '방문 예정일은 오늘 이후여야 합니다.' },
  ),
});

export type CreateApplicationRequest = z.infer<typeof CreateApplicationSchema>;

/**
 * Application entity schema (DB response)
 */
export const ApplicationSchema = z.object({
  id: z.string().uuid(),
  campaign_id: z.string().uuid(),
  user_id: z.string().uuid(),
  message: z.string(),
  visit_date: z.string(),
  status: ApplicationStatusSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

export type Application = z.infer<typeof ApplicationSchema>;

/**
 * POST /api/applications - Response schema
 */
export const CreateApplicationResponseSchema = z.object({
  id: z.string().uuid(),
  campaign_id: z.string().uuid(),
  user_id: z.string().uuid(),
  message: z.string(),
  visit_date: z.string(),
  status: ApplicationStatusSchema,
  created_at: z.string(),
});

export type CreateApplicationResponse = z.infer<typeof CreateApplicationResponseSchema>;

/**
 * GET /api/applications - Query schema
 */
export const GetApplicationsQuerySchema = z.object({
  status: ApplicationStatusSchema.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type GetApplicationsQuery = z.infer<typeof GetApplicationsQuerySchema>;

/**
 * Application with campaign info schema
 */
export const ApplicationWithCampaignSchema = z.object({
  id: z.string().uuid(),
  campaign_id: z.string().uuid(),
  message: z.string(),
  visit_date: z.string(),
  status: ApplicationStatusSchema,
  created_at: z.string(),
  campaign: z.object({
    id: z.string().uuid(),
    title: z.string(),
    recruitment_start_date: z.string(),
    recruitment_end_date: z.string(),
    benefits: z.string(),
    status: z.string(),
  }),
});

export type ApplicationWithCampaign = z.infer<typeof ApplicationWithCampaignSchema>;

/**
 * Pagination meta schema
 */
export const ApplicationPaginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export type ApplicationPaginationMeta = z.infer<typeof ApplicationPaginationMetaSchema>;

/**
 * GET /api/applications - Response schema
 */
export const GetApplicationsResponseSchema = z.object({
  data: z.array(ApplicationWithCampaignSchema),
  pagination: ApplicationPaginationMetaSchema,
});

export type GetApplicationsResponse = z.infer<typeof GetApplicationsResponseSchema>;
