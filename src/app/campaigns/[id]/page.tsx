'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCampaignDetail } from '@/features/campaigns/hooks/useCampaignDetail';
import { useApplicationCheck } from '@/features/campaigns/hooks/useApplicationCheck';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { CampaignDetailView } from '@/features/campaigns/components/campaign-detail-view';
import { CampaignDetailSkeleton } from '@/features/campaigns/components/campaign-detail-skeleton';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/remote/api-client';

type CampaignDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useCurrentUser();
  const [hasProfile, setHasProfile] = useState(false);

  const {
    data: campaign,
    isLoading: isCampaignLoading,
    error: campaignError,
  } = useCampaignDetail(id);

  const userId = user?.id;
  const userRole = user?.role;

  // 인플루언서만 지원 여부 확인
  const {
    data: applicationCheck,
    isLoading: isApplicationCheckLoading,
  } = useApplicationCheck(id, userRole === 'influencer' ? userId : undefined);

  useEffect(() => {
    const checkInfluencerProfile = async () => {
      // 인플루언서만 프로필 체크
      if (!userId || userRole !== 'influencer') {
        setHasProfile(false);
        return;
      }

      try {
        const response = await apiClient.get(`/influencer-profiles/${userId}`);
        setHasProfile(!!response.data);
      } catch {
        setHasProfile(false);
      }
    };

    checkInfluencerProfile();
  }, [userId, userRole]);

  const isLoading = isCampaignLoading || (userId && userRole === 'influencer' && isApplicationCheckLoading);

  if (isLoading) {
    return <CampaignDetailSkeleton />;
  }

  if (campaignError || !campaign) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">
            존재하지 않는 체험단입니다
          </h1>
          <p className="text-gray-600">
            요청하신 체험단을 찾을 수 없습니다.
          </p>
          <Button onClick={() => router.push('/campaigns')}>
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <CampaignDetailView
      campaign={campaign}
      applicationCheck={applicationCheck || { applied: false, application: null }}
      hasInfluencerProfile={hasProfile}
    />
  );
}
