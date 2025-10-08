export const advertiserProfileErrorCodes = {
  businessNumberDuplicate: 'ADVERTISER_BUSINESS_NUMBER_DUPLICATE',
  businessNumberInvalid: 'ADVERTISER_BUSINESS_NUMBER_INVALID',
  invalidInput: 'ADVERTISER_INVALID_INPUT',
  databaseError: 'ADVERTISER_DATABASE_ERROR',
  profileAlreadyExists: 'ADVERTISER_PROFILE_ALREADY_EXISTS',
  userNotFound: 'ADVERTISER_USER_NOT_FOUND',
} as const;

type AdvertiserProfileErrorValue = (typeof advertiserProfileErrorCodes)[keyof typeof advertiserProfileErrorCodes];

export type AdvertiserProfileServiceError = AdvertiserProfileErrorValue;

