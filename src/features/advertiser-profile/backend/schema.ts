import { z } from 'zod';
import { ADVERTISER_CATEGORIES } from '@/constants/categories';

export const CreateAdvertiserProfileRequestSchema = z.object({
  userId: z.string().uuid(),
  companyName: z.string().min(2, '업체명은 최소 2자 이상이어야 합니다.').max(255),
  location: z.string().min(1, '위치를 입력해주세요.').max(500),
  category: z.enum([
    ADVERTISER_CATEGORIES.RESTAURANT,
    ADVERTISER_CATEGORIES.CAFE,
    ADVERTISER_CATEGORIES.BEAUTY,
    ADVERTISER_CATEGORIES.FASHION,
    ADVERTISER_CATEGORIES.LIFESTYLE,
    ADVERTISER_CATEGORIES.ELECTRONICS,
    ADVERTISER_CATEGORIES.EDUCATION,
    ADVERTISER_CATEGORIES.TRAVEL,
    ADVERTISER_CATEGORIES.FITNESS,
    ADVERTISER_CATEGORIES.ETC,
  ]),
  businessRegistrationNumber: z.string().regex(/^\d{10}$/, '사업자등록번호는 10자리 숫자여야 합니다.'),
});

export type CreateAdvertiserProfileRequest = z.infer<typeof CreateAdvertiserProfileRequestSchema>;

export const CreateAdvertiserProfileResponseSchema = z.object({
  profileId: z.string().uuid(),
  message: z.string(),
});

export type CreateAdvertiserProfileResponse = z.infer<typeof CreateAdvertiserProfileResponseSchema>;

export const AdvertiserProfileRowSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  company_name: z.string(),
  location: z.string(),
  category: z.string(),
  business_registration_number: z.string(),
  is_verified: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type AdvertiserProfileRow = z.infer<typeof AdvertiserProfileRowSchema>;

