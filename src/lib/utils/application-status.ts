export type ApplicationEligibility = {
  canApply: boolean;
  reason?: 'not_authenticated' | 'not_influencer' | 'already_applied' |
           'recruitment_not_started' | 'recruitment_ended' | 'profile_required';
  message: string;
};

export type CheckApplicationEligibilityParams = {
  isAuthenticated: boolean;
  userRole?: 'influencer' | 'advertiser';
  hasInfluencerProfile?: boolean;
  alreadyApplied: boolean;
  recruitmentStartDate: string;
  recruitmentEndDate: string;
  campaignStatus: string;
};

export const checkApplicationEligibility = (params: CheckApplicationEligibilityParams): ApplicationEligibility => {
  const {
    isAuthenticated,
    userRole,
    hasInfluencerProfile,
    alreadyApplied,
    recruitmentStartDate,
    recruitmentEndDate,
    campaignStatus
  } = params;

  if (!isAuthenticated) {
    return {
      canApply: false,
      reason: 'not_authenticated',
      message: '로그인 후 지원 가능합니다'
    };
  }

  if (userRole !== 'influencer') {
    return {
      canApply: false,
      reason: 'not_influencer',
      message: '광고주는 지원할 수 없습니다'
    };
  }

  if (!hasInfluencerProfile) {
    return {
      canApply: false,
      reason: 'profile_required',
      message: '인플루언서 정보를 먼저 등록해주세요'
    };
  }

  if (alreadyApplied) {
    return {
      canApply: false,
      reason: 'already_applied',
      message: '이미 지원한 체험단입니다'
    };
  }

  if (campaignStatus !== 'recruiting') {
    return {
      canApply: false,
      reason: 'recruitment_ended',
      message: '모집이 종료되었습니다'
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(recruitmentStartDate);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(recruitmentEndDate);
  endDate.setHours(0, 0, 0, 0);

  if (today < startDate) {
    return {
      canApply: false,
      reason: 'recruitment_not_started',
      message: '아직 모집 기간이 아닙니다'
    };
  }

  if (today > endDate) {
    return {
      canApply: false,
      reason: 'recruitment_ended',
      message: '모집 기간이 종료되었습니다'
    };
  }

  return {
    canApply: true,
    message: '지원 가능'
  };
};
