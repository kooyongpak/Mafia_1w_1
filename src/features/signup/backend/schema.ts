import { z } from 'zod';
import { AGREEMENT_TYPES } from '@/constants/agreements';

// 요청 스키마
export const AgreementInputSchema = z.object({
  type: z.enum([
    AGREEMENT_TYPES.TERMS_OF_SERVICE,
    AGREEMENT_TYPES.PRIVACY_POLICY,
    AGREEMENT_TYPES.MARKETING,
  ]),
  agreed: z.boolean(),
});

export const SignupRequestSchema = z.object({
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다.').max(100),
  phone: z.string().regex(/^01[016789]-?\d{3,4}-?\d{4}$/, '올바른 휴대폰번호 형식이 아닙니다.'),
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
  role: z.enum(['influencer', 'advertiser'], {
    errorMap: () => ({ message: '역할은 influencer 또는 advertiser여야 합니다.' }),
  }),
  agreements: z.array(AgreementInputSchema).min(1, '최소 하나의 약관에 동의해야 합니다.'),
});

export type SignupRequest = z.infer<typeof SignupRequestSchema>;
export type AgreementInput = z.infer<typeof AgreementInputSchema>;

// 응답 스키마
export const SignupResponseSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['influencer', 'advertiser']),
  requiresEmailVerification: z.boolean(),
  message: z.string(),
});

export type SignupResponse = z.infer<typeof SignupResponseSchema>;

// DB Row 스키마
export const UserRowSchema = z.object({
  id: z.string().uuid(),
  auth_user_id: z.string().uuid(),
  name: z.string(),
  phone: z.string(),
  email: z.string(),
  role: z.enum(['influencer', 'advertiser']),
  created_at: z.string(),
  updated_at: z.string(),
});

export type UserRow = z.infer<typeof UserRowSchema>;
