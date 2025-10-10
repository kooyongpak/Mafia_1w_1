import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import type { CreateAdvertiserProfileRequest, CreateAdvertiserProfileResponse } from './schema';
import { advertiserProfileErrorCodes, type AdvertiserProfileServiceError } from './error';

const ADVERTISER_PROFILES_TABLE = 'advertiser_profiles';
const USERS_TABLE = 'users';

export const checkBusinessNumberExists = async (
  client: SupabaseClient,
  businessNumber: string,
): Promise<HandlerResult<boolean, AdvertiserProfileServiceError, unknown>> => {
  const { data, error } = await client
    .from(ADVERTISER_PROFILES_TABLE)
    .select('business_registration_number')
    .eq('business_registration_number', businessNumber)
    .maybeSingle();

  if (error) {
    return failure(500, advertiserProfileErrorCodes.databaseError, error.message);
  }

  return success(data !== null);
};

export const checkProfileExists = async (
  client: SupabaseClient,
  userId: string,
): Promise<HandlerResult<boolean, AdvertiserProfileServiceError, unknown>> => {
  const { data, error } = await client
    .from(ADVERTISER_PROFILES_TABLE)
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return failure(500, advertiserProfileErrorCodes.databaseError, error.message);
  }

  return success(data !== null);
};

export const createAdvertiserProfile = async (
  client: SupabaseClient,
  profileData: CreateAdvertiserProfileRequest,
): Promise<HandlerResult<CreateAdvertiserProfileResponse, AdvertiserProfileServiceError, unknown>> => {
  const { data: user, error: userError } = await client
    .from(USERS_TABLE)
    .select('id, role')
    .eq('auth_user_id', profileData.userId)
    .maybeSingle();

  if (userError) {
    return failure(500, advertiserProfileErrorCodes.databaseError, userError.message);
  }

  if (!user) {
    return failure(404, advertiserProfileErrorCodes.userNotFound, '사용자를 찾을 수 없습니다.');
  }

  if (user.role !== 'advertiser') {
    return failure(400, advertiserProfileErrorCodes.invalidInput, '광고주 역할이 아닙니다.');
  }

  const profileExistsResult = await checkProfileExists(client, user.id);

  if (!profileExistsResult.ok) {
    return profileExistsResult as HandlerResult<CreateAdvertiserProfileResponse, AdvertiserProfileServiceError, unknown>;
  }

  if (profileExistsResult.data) {
    return failure(
      400,
      advertiserProfileErrorCodes.profileAlreadyExists,
      '이미 광고주 프로필이 존재합니다.',
    );
  }

  const businessNumberExistsResult = await checkBusinessNumberExists(
    client,
    profileData.businessRegistrationNumber,
  );

  if (!businessNumberExistsResult.ok) {
    return businessNumberExistsResult as HandlerResult<CreateAdvertiserProfileResponse, AdvertiserProfileServiceError, unknown>;
  }

  if (businessNumberExistsResult.data) {
    return failure(
      400,
      advertiserProfileErrorCodes.businessNumberDuplicate,
      '이미 등록된 사업자등록번호입니다.',
    );
  }

  const { data: profile, error: profileError } = await client
    .from(ADVERTISER_PROFILES_TABLE)
    .insert({
      user_id: user.id,
      company_name: profileData.companyName,
      location: profileData.location,
      category: profileData.category,
      business_registration_number: profileData.businessRegistrationNumber,
    })
    .select('id')
    .single();

  if (profileError || !profile) {
    return failure(
      500,
      advertiserProfileErrorCodes.databaseError,
      profileError?.message ?? '광고주 프로필 생성에 실패했습니다.',
    );
  }

  return success({
    profileId: profile.id,
    message: '광고주 정보가 등록되었습니다.',
  });
};

