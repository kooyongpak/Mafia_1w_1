/**
 * Re-export application schemas for frontend use
 */

export {
  ApplicationStatusSchema,
  CreateApplicationSchema,
  ApplicationSchema,
  CreateApplicationResponseSchema,
  GetApplicationsQuerySchema,
  ApplicationWithCampaignSchema,
  ApplicationPaginationMetaSchema,
  GetApplicationsResponseSchema,
  type ApplicationStatus,
  type CreateApplicationRequest,
  type Application,
  type CreateApplicationResponse,
  type GetApplicationsQuery,
  type ApplicationWithCampaign,
  type ApplicationPaginationMeta,
  type GetApplicationsResponse,
} from '../backend/schema';

export { applicationErrorCodes, type ApplicationErrorCode } from '../backend/error';
