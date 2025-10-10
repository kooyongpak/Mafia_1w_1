'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useCampaignDetail } from '@/features/campaigns/hooks/useCampaignDetail';
import { useApplicationCheck } from '@/features/campaigns/hooks/useApplicationCheck';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { CampaignSummaryCard } from '@/features/applications/components/campaign-summary-card';
import { ApplicationForm } from '@/features/applications/components/application-form';

interface CampaignApplyPageProps {
  params: Promise<{ id: string }>;
}

/**
 * 체험단 지원 페이지
 * /campaigns/:id/apply
 */
export default function CampaignApplyPage({ params }: CampaignApplyPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { isAuthenticated, user, isLoading: userLoading } = useCurrentUser();

  const userRole = user?.userMetadata?.role as 'influencer' | 'advertiser' | undefined;
  const userId = user?.id;

  const {
    data: campaign,
    isLoading: campaignLoading,
    error: campaignError,
  } = useCampaignDetail(resolvedParams.id);

  const {
    data: applicationCheckData,
    isLoading: applicationCheckLoading,
  } = useApplicationCheck(resolvedParams.id, userId);

  const applicationCheck = applicationCheckData as
    | { applied: boolean; application: unknown }
    | undefined;

  // Guard: Check authentication
  useEffect(() => {
    if (!userLoading && !isAuthenticated) {
      router.push(`/login?returnUrl=/campaigns/${resolvedParams.id}/apply`);
    }
  }, [userLoading, isAuthenticated, router, resolvedParams.id]);

  // Guard: Check user role
  useEffect(() => {
    if (!userLoading && isAuthenticated && userRole !== 'influencer') {
      router.push(`/campaigns/${resolvedParams.id}`);
    }
  }, [userLoading, isAuthenticated, userRole, router, resolvedParams.id]);

  // Guard: Check if already applied
  useEffect(() => {
    if (applicationCheck?.applied) {
      router.push('/applications');
    }
  }, [applicationCheck, router]);

  // Loading state
  if (userLoading || campaignLoading || applicationCheckLoading) {
    return (
      <div className="py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          </div>
        </div>
      </div>
    );
  }

  // Error state: Campaign not found
  if (campaignError || !campaign) {
    return (
      <div className="py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>체험단을 찾을 수 없습니다</AlertTitle>
            <AlertDescription>
              요청하신 체험단이 존재하지 않거나 삭제되었습니다.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link href="/">체험단 목록으로 돌아가기</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Error state: Campaign not recruiting
  if (campaign.status !== 'recruiting') {
    return (
      <div className="py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>지원할 수 없는 체험단입니다</AlertTitle>
            <AlertDescription>
              이 체험단은 현재 모집 중이 아닙니다.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link href={`/campaigns/${resolvedParams.id}`}>체험단 상세로 돌아가기</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="gap-2 pl-0">
            <Link href={`/campaigns/${resolvedParams.id}`}>
              <ChevronLeft className="h-4 w-4" />
              체험단 상세로 돌아가기
            </Link>
          </Button>
        </div>

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">체험단 지원하기</h1>
          <p className="text-gray-600">
            아래 정보를 입력하여 체험단에 지원해주세요.
          </p>
        </div>

        {/* Campaign summary */}
        <CampaignSummaryCard campaign={campaign} />

        {/* Application form */}
        <div className="bg-white rounded-lg border p-6">
          <ApplicationForm
            campaignId={resolvedParams.id}
            recruitmentStartDate={campaign.recruitment_start_date}
            recruitmentEndDate={campaign.recruitment_end_date}
          />
        </div>
      </div>
    </div>
  );
}
