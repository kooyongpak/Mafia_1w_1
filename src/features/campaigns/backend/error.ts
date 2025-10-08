export const campaignErrorCodes = {
  fetchError: 'CAMPAIGNS_FETCH_ERROR',
  invalidQueryParams: 'CAMPAIGNS_INVALID_QUERY_PARAMS',
  databaseError: 'CAMPAIGNS_DATABASE_ERROR',
  notFound: 'CAMPAIGN_NOT_FOUND',
} as const;

type CampaignErrorValue = (typeof campaignErrorCodes)[keyof typeof campaignErrorCodes];

export type CampaignServiceError = CampaignErrorValue;

