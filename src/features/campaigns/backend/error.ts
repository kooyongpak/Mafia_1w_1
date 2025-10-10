export const campaignErrorCodes = {
  fetchError: 'CAMPAIGNS_FETCH_ERROR',
  invalidQueryParams: 'CAMPAIGNS_INVALID_QUERY_PARAMS',
  databaseError: 'CAMPAIGNS_DATABASE_ERROR',
  notFound: 'CAMPAIGN_NOT_FOUND',
  invalidCampaignId: 'INVALID_CAMPAIGN_ID',
  applicationCheckError: 'APPLICATION_CHECK_ERROR',
  invalidApplicationCheckQuery: 'INVALID_APPLICATION_CHECK_QUERY',
  createError: 'CAMPAIGN_CREATE_ERROR',
  invalidInput: 'INVALID_INPUT',
  unauthorized: 'UNAUTHORIZED',
  forbidden: 'FORBIDDEN',
  advertiserNotFound: 'ADVERTISER_NOT_FOUND',
} as const;

type CampaignErrorValue = (typeof campaignErrorCodes)[keyof typeof campaignErrorCodes];

export type CampaignServiceError = CampaignErrorValue;

