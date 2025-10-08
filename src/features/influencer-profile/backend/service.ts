import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import type { CreateInfluencerProfileRequest, CreateInfluencerProfileResponse } from './schema';
import { influencerProfileErrorCodes, type InfluencerProfileServiceError } from './error';
import { validateBirthDate } from '@/lib/validation/birth-date';
import { validateChannelUrl } from '@/lib/validation/channel-url';

const INFLUENCER_PROFILES_TABLE = 'influencer_profiles';
const INFLUENCER_CHANNELS_TABLE = 'influencer_channels';

export const checkProfileExists = async (
  client: SupabaseClient,
  userId: string,
): Promise<HandlerResult<boolean, InfluencerProfileServiceError, unknown>> => {
  const { data, error } = await client
    .from(INFLUENCER_PROFILES_TABLE)
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return failure(500, influencerProfileErrorCodes.databaseError, error.message);
  }

  return success(data !== null);
};

const validateBirthDateInput = (birthDate: string): string | null => {
  return validateBirthDate(new Date(birthDate));
};

const checkDuplicateChannelUrls = (channels: CreateInfluencerProfileRequest['channels']): boolean => {
  const urls = channels.map(c => c.channelUrl);
  return new Set(urls).size !== urls.length;
};

export const createInfluencerProfile = async (
  client: SupabaseClient,
  profileData: CreateInfluencerProfileRequest,
): Promise<HandlerResult<CreateInfluencerProfileResponse, InfluencerProfileServiceError, unknown>> => {
  const birthDateError = validateBirthDateInput(profileData.birthDate);
  if (birthDateError) {
    return failure(400, influencerProfileErrorCodes.invalidBirthDate, birthDateError);
  }

  for (const channel of profileData.channels) {
    const urlError = validateChannelUrl(channel.channelType, channel.channelUrl);
    if (urlError) {
      return failure(400, influencerProfileErrorCodes.invalidChannelUrl, urlError);
    }
  }

  if (checkDuplicateChannelUrls(profileData.channels)) {
    return failure(400, influencerProfileErrorCodes.duplicateChannelUrl, '이미 등록된 채널이 있습니다.');
  }

  const existsResult = await checkProfileExists(client, profileData.userId);
  if (!existsResult.ok) {
    return existsResult as HandlerResult<CreateInfluencerProfileResponse, InfluencerProfileServiceError, unknown>;
  }
  if (existsResult.data) {
    return failure(400, influencerProfileErrorCodes.profileAlreadyExists, '이미 프로필이 등록되어 있습니다.');
  }

  const { data: profileRow, error: profileError } = await client
    .from(INFLUENCER_PROFILES_TABLE)
    .insert({
      user_id: profileData.userId,
      birth_date: profileData.birthDate,
      is_verified: false,
    })
    .select('id')
    .single();

  if (profileError || !profileRow) {
    return failure(
      500,
      influencerProfileErrorCodes.databaseError,
      profileError?.message ?? 'influencer_profiles 테이블 생성에 실패했습니다.',
    );
  }

  const profileId = profileRow.id;

  const channelRecords = profileData.channels.map(channel => ({
    influencer_id: profileId,
    channel_type: channel.channelType,
    channel_name: channel.channelName,
    channel_url: channel.channelUrl,
    verification_status: 'pending' as const,
  }));

  const { error: channelsError } = await client
    .from(INFLUENCER_CHANNELS_TABLE)
    .insert(channelRecords);

  if (channelsError) {
    console.error('Failed to save channels:', channelsError.message);
  }

  return success({
    profileId,
    message: '인플루언서 정보가 등록되었습니다.',
  });
};
