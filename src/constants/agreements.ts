export const AGREEMENT_TYPES = {
  TERMS_OF_SERVICE: 'terms_of_service',
  PRIVACY_POLICY: 'privacy_policy',
  MARKETING: 'marketing',
} as const;

export type AgreementType = (typeof AGREEMENT_TYPES)[keyof typeof AGREEMENT_TYPES];

export const REQUIRED_AGREEMENTS: AgreementType[] = [
  AGREEMENT_TYPES.TERMS_OF_SERVICE,
  AGREEMENT_TYPES.PRIVACY_POLICY,
];
