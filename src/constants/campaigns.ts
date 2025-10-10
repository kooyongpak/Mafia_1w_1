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

export const STATUS_BADGE_VARIANTS = {
  recruiting: { variant: 'default' as const, label: '모집중' },
  closed: { variant: 'secondary' as const, label: '모집종료' },
  completed: { variant: 'outline' as const, label: '완료' },
} as const;

export const APPLICATION_STATUS = {
  PENDING: 'pending',
  SELECTED: 'selected',
  REJECTED: 'rejected',
} as const;

export type ApplicationStatus = (typeof APPLICATION_STATUS)[keyof typeof APPLICATION_STATUS];

export const APPLICATION_STATUS_LABELS = {
  pending: '대기중',
  selected: '선정',
  rejected: '반려',
} as const;

