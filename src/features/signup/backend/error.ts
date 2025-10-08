export const signupErrorCodes = {
  emailAlreadyExists: 'SIGNUP_EMAIL_ALREADY_EXISTS',
  invalidInput: 'SIGNUP_INVALID_INPUT',
  authCreationFailed: 'SIGNUP_AUTH_CREATION_FAILED',
  databaseError: 'SIGNUP_DATABASE_ERROR',
  rateLimitExceeded: 'SIGNUP_RATE_LIMIT_EXCEEDED',
  weakPassword: 'SIGNUP_WEAK_PASSWORD',
  invalidPhone: 'SIGNUP_INVALID_PHONE',
} as const;

type SignupErrorValue = (typeof signupErrorCodes)[keyof typeof signupErrorCodes];

export type SignupServiceError = SignupErrorValue;
