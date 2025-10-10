'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useApplications } from '@/features/applications/hooks/useApplications';
import { ApplicationStatusTabs } from '@/features/applications/components/application-status-tabs';
import { ApplicationsList } from '@/features/applications/components/applications-list';
import { ApplicationsEmptyState } from '@/features/applications/components/applications-empty-state';
import { ApplicationsListSkeleton } from '@/features/applications/components/applications-list-skeleton';
import { CampaignPagination } from '@/features/campaigns/components/campaign-pagination';
import type { ApplicationStatus } from '@/features/applications/lib/dto';

/**
 * 내 지원 목록 페이지
 * 인플루언서 전용
 */
export default function ApplicationsPage() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading: userLoading } = useCurrentUser();
  const userRole = user?.userMetadata?.role as 'influencer' | 'advertiser' | undefined;

  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useApplications({
    status: statusFilter === 'all' ? undefined : statusFilter,
    page,
    limit: 20,
  });

  // Guard: Check authentication
  useEffect(() => {
    if (!userLoading && !isAuthenticated) {
      router.push('/login?returnUrl=/applications');
    }
  }, [userLoading, isAuthenticated, router]);

  // Guard: Check user role
  useEffect(() => {
    if (!userLoading && isAuthenticated && userRole !== 'influencer') {
      router.push('/');
    }
  }, [userLoading, isAuthenticated, userRole, router]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  // Loading state
  if (userLoading || (isAuthenticated && userRole === 'influencer' && isLoading)) {
    return (
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">내 지원 목록</h1>
          </div>
          <ApplicationsListSkeleton />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Alert variant="destructive">
            <AlertTitle>오류가 발생했습니다</AlertTitle>
            <AlertDescription>
              지원 목록을 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => window.location.reload()}>다시 시도</Button>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated or not influencer - don't render content
  if (!isAuthenticated || userRole !== 'influencer') {
    return null;
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">내 지원 목록</h1>
          <p className="text-gray-600">내가 지원한 체험단 내역을 확인할 수 있습니다</p>
        </div>

        {/* Status Tabs */}
        <div className="mb-6">
          <ApplicationStatusTabs
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as ApplicationStatus | 'all')}
          />
        </div>

        {/* Content */}
        {data && data.data.length === 0 ? (
          <ApplicationsEmptyState />
        ) : (
          <>
            {data && <ApplicationsList applications={data.data} />}
            {data && data.pagination.totalPages > 1 && (
              <div className="mt-8">
                <CampaignPagination
                  pagination={data.pagination}
                  onPageChange={(newPage) => {
                    setPage(newPage);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
