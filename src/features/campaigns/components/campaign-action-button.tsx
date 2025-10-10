'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { checkApplicationEligibility } from '@/lib/utils/application-status';
import type { CampaignDetail, CheckApplicationResponse } from '../lib/dto';

type CampaignActionButtonProps = {
  campaign: CampaignDetail;
  applicationCheck: CheckApplicationResponse;
  hasInfluencerProfile: boolean;
};

export const CampaignActionButton = ({
  campaign,
  applicationCheck,
  hasInfluencerProfile,
}: CampaignActionButtonProps) => {
  const router = useRouter();
  const { isAuthenticated, user } = useCurrentUser();

  const userRole = user?.userMetadata?.role as 'influencer' | 'advertiser' | undefined;

  const eligibility = checkApplicationEligibility({
    isAuthenticated,
    userRole,
    hasInfluencerProfile,
    alreadyApplied: applicationCheck.applied,
    recruitmentStartDate: campaign.recruitment_start_date,
    recruitmentEndDate: campaign.recruitment_end_date,
    campaignStatus: campaign.status,
  });

  const handleClick = () => {
    if (!isAuthenticated) {
      router.push('/signin');
      return;
    }

    if (eligibility.reason === 'profile_required') {
      router.push('/influencer/register');
      return;
    }

    if (eligibility.canApply) {
      router.push(`/campaigns/${campaign.id}/apply`);
    }
  };

  if (userRole === 'advertiser') {
    return (
      <div className="text-sm text-gray-600 text-center py-4">
        광고주는 지원할 수 없습니다
      </div>
    );
  }

  if (applicationCheck.applied) {
    return (
      <Button
        size="lg"
        className="w-full"
        disabled
        aria-label="지원 완료됨"
      >
        지원 완료
      </Button>
    );
  }

  if (!eligibility.canApply) {
    if (eligibility.reason === 'not_authenticated') {
      return (
        <Button
          size="lg"
          className="w-full"
          onClick={handleClick}
          aria-label="로그인하고 지원하기"
        >
          로그인하고 지원하기
        </Button>
      );
    }

    if (eligibility.reason === 'profile_required') {
      return (
        <Button
          size="lg"
          className="w-full"
          onClick={handleClick}
          aria-label="프로필 등록하기"
        >
          프로필 등록하기
        </Button>
      );
    }

    return (
      <Button
        size="lg"
        className="w-full"
        disabled
        aria-label={eligibility.message}
      >
        {eligibility.message}
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      className="w-full"
      onClick={handleClick}
      aria-label="지원하기"
    >
      지원하기
    </Button>
  );
};
