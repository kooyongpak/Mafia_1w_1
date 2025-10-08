export const influencerProfileErrorCodes = {
  invalidInput: 'INFLUENCER_PROFILE_INVALID_INPUT',
  databaseError: 'INFLUENCER_PROFILE_DATABASE_ERROR',
  profileAlreadyExists: 'INFLUENCER_PROFILE_ALREADY_EXISTS',
  invalidBirthDate: 'INFLUENCER_PROFILE_INVALID_BIRTH_DATE',
  invalidChannelUrl: 'INFLUENCER_PROFILE_INVALID_CHANNEL_URL',
  minChannelRequired: 'INFLUENCER_PROFILE_MIN_CHANNEL_REQUIRED',
  duplicateChannelUrl: 'INFLUENCER_PROFILE_DUPLICATE_CHANNEL_URL',
} as const;

type InfluencerProfileErrorValue = (typeof influencerProfileErrorCodes)[keyof typeof influencerProfileErrorCodes];

export type InfluencerProfileServiceError = InfluencerProfileErrorValue;
