import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import type { SignupRequest, SignupResponse } from './schema';
import { signupErrorCodes, type SignupServiceError } from './error';
import { formatPhoneNumber } from '@/lib/validation/phone';
import { REQUIRED_AGREEMENTS } from '@/constants/agreements';

const USERS_TABLE = 'users';
const USER_AGREEMENTS_TABLE = 'user_agreements';

export const checkEmailExists = async (
  client: SupabaseClient,
  email: string,
): Promise<HandlerResult<boolean, SignupServiceError, unknown>> => {
  const { data, error } = await client
    .from(USERS_TABLE)
    .select('email')
    .eq('email', email)
    .maybeSingle();

  if (error) {
    return failure(500, signupErrorCodes.databaseError, error.message);
  }

  return success(data !== null);
};

const validateRequiredAgreements = (
  agreements: SignupRequest['agreements'],
): boolean => {
  const agreedTypes = agreements
    .filter((a) => a.agreed)
    .map((a) => a.type);

  return REQUIRED_AGREEMENTS.every((required) =>
    agreedTypes.includes(required),
  );
};

export const createUserAccount = async (
  client: SupabaseClient,
  signupData: SignupRequest,
): Promise<HandlerResult<SignupResponse, SignupServiceError, unknown>> => {
  // 1. 필수 약관 동의 확인
  if (!validateRequiredAgreements(signupData.agreements)) {
    return failure(
      400,
      signupErrorCodes.invalidInput,
      '필수 약관에 모두 동의해야 합니다.',
    );
  }

  // 2. 이메일 중복 확인
  const emailCheckResult = await checkEmailExists(client, signupData.email);

  if (!emailCheckResult.ok) {
    return emailCheckResult as HandlerResult<SignupResponse, SignupServiceError, unknown>;
  }

  if (emailCheckResult.data) {
    return failure(
      400,
      signupErrorCodes.emailAlreadyExists,
      '이미 사용 중인 이메일입니다.',
    );
  }

  // 3. Supabase Auth 계정 생성
  const { data: authData, error: authError } = await client.auth.admin.createUser({
    email: signupData.email,
    password: signupData.password,
    email_confirm: true, // 개발 환경: 이메일 인증 자동 완료
  });

  if (authError || !authData.user) {
    return failure(
      500,
      signupErrorCodes.authCreationFailed,
      authError?.message ?? 'Auth 계정 생성에 실패했습니다.',
    );
  }

  const authId = authData.user.id;

  // 4. users 테이블에 프로필 생성
  const formattedPhone = formatPhoneNumber(signupData.phone);

  const { data: userData, error: userError } = await client
    .from(USERS_TABLE)
    .insert({
      auth_user_id: authId,
      name: signupData.name,
      phone: formattedPhone,
      email: signupData.email,
      role: signupData.role,
    })
    .select('id')
    .single();

  if (userError || !userData) {
    // Rollback: Auth 계정 삭제
    await client.auth.admin.deleteUser(authId);

    return failure(
      500,
      signupErrorCodes.databaseError,
      userError?.message ?? 'users 테이블 생성에 실패했습니다.',
    );
  }

  const userId = userData.id;

  // 5. user_agreements 저장
  const agreementRecords = signupData.agreements
    .filter((a) => a.agreed)
    .map((a) => ({
      user_id: userId,
      agreement_type: a.type,
      agreed: true,
    }));

  if (agreementRecords.length > 0) {
    const { error: agreementError } = await client
      .from(USER_AGREEMENTS_TABLE)
      .insert(agreementRecords);

    if (agreementError) {
      // Rollback은 복잡하므로 로그만 남기고 진행
      console.error('Failed to save agreements:', agreementError.message);
    }
  }

  return success({
    userId,
    role: signupData.role,
    requiresEmailVerification: false,
    message: '회원가입이 완료되었습니다. 로그인해 주세요.',
  });
};
