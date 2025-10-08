import { z } from 'zod';
import { CHANNEL_TYPES } from '@/constants/channels';

export const ChannelInputSchema = z.object({
  channelType: z.enum([
    CHANNEL_TYPES.NAVER,
    CHANNEL_TYPES.YOUTUBE,
    CHANNEL_TYPES.INSTAGRAM,
    CHANNEL_TYPES.THREADS,
  ]),
  channelName: z.string().min(1, '채널명을 입력해주세요.').max(255),
  channelUrl: z.string().url('올바른 URL 형식이 아닙니다.'),
});

export type ChannelInput = z.infer<typeof ChannelInputSchema>;

export const CreateInfluencerProfileRequestSchema = z.object({
  userId: z.string().uuid('올바른 사용자 ID가 아닙니다.'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다.'),
  channels: z.array(ChannelInputSchema).min(1, '최소 1개 이상의 채널을 등록해주세요.'),
});

export type CreateInfluencerProfileRequest = z.infer<typeof CreateInfluencerProfileRequestSchema>;

export const CreateInfluencerProfileResponseSchema = z.object({
  profileId: z.string().uuid(),
  message: z.string(),
});

export type CreateInfluencerProfileResponse = z.infer<typeof CreateInfluencerProfileResponseSchema>;
