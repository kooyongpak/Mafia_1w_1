/**
 * Application feature error codes
 * 체험단 지원 관련 에러 코드 정의
 */

export const applicationErrorCodes = {
  // Input validation errors
  invalidInput: 'INVALID_INPUT',
  invalidCampaignId: 'INVALID_CAMPAIGN_ID',
  invalidMessage: 'INVALID_MESSAGE',
  invalidVisitDate: 'INVALID_VISIT_DATE',

  // Business logic errors
  campaignNotFound: 'CAMPAIGN_NOT_FOUND',
  campaignNotAvailable: 'CAMPAIGN_NOT_AVAILABLE',
  alreadyApplied: 'ALREADY_APPLIED',
  recruitmentClosed: 'RECRUITMENT_CLOSED',
  unauthorized: 'UNAUTHORIZED',
  forbidden: 'FORBIDDEN',
  profileNotFound: 'PROFILE_NOT_FOUND',
  invalidRole: 'INVALID_ROLE',

  // Database errors
  databaseError: 'DATABASE_ERROR',
  createError: 'APPLICATION_CREATE_ERROR',
} as const;

export type ApplicationErrorCode =
  (typeof applicationErrorCodes)[keyof typeof applicationErrorCodes];

export type ApplicationServiceError = {
  code: ApplicationErrorCode;
  message: string;
  details?: unknown;
};
