export const CAMPAIGN_STATUS = {
  RECRUITING: 'recruiting',
  CLOSED: 'closed',
  COMPLETED: 'completed',
} as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUS)[keyof typeof CAMPAIGN_STATUS];

export const CAMPAIGN_SORT = {
  LATEST: 'latest',
  DEADLINE: 'deadline',
  POPULAR: 'popular',
} as const;

export type CampaignSort = (typeof CAMPAIGN_SORT)[keyof typeof CAMPAIGN_SORT];

export const PAGINATION_DEFAULTS = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
  MAX_PAGES: 100,
} as const;

