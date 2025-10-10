'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useAdvertiserCampaigns } from '@/features/campaigns/hooks/useAdvertiserCampaigns';
import { CreateCampaignDialog } from '@/features/campaigns/components/create-campaign-dialog';
import { AdvertiserCampaignsList } from '@/features/campaigns/components/advertiser-campaigns-list';
import { AdvertiserCampaignsEmptyState } from '@/features/campaigns/components/advertiser-campaigns-empty-state';
import { AdvertiserCampaignsListSkeleton } from '@/features/campaigns/components/advertiser-campaigns-list-skeleton';
import { CampaignPagination } from '@/features/campaigns/components/campaign-pagination';

export default function CampaignsManagePage() {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data, isLoading, error, refetch } = useAdvertiserCampaigns({
    page,
    limit: 20,
  });

  const handleCreateClick = () => {
    setDialogOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">체험단 관리</h1>
          <p className="text-muted-foreground mt-2">
            등록한 체험단을 확인하고 관리하세요.
          </p>
        </div>
        <Button onClick={handleCreateClick}>
          신규 체험단 등록
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            체험단 목록을 불러오는 중 오류가 발생했습니다.
            <Button
              variant="link"
              className="ml-2 p-0 h-auto"
              onClick={() => refetch()}
            >
              다시 시도
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <AdvertiserCampaignsListSkeleton />
      ) : data && data.data.length > 0 ? (
        <>
          <AdvertiserCampaignsList campaigns={data.data} />
          {data.pagination.total_pages > 1 && (
            <div className="mt-8">
              <CampaignPagination
                pagination={data.pagination}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      ) : (
        <AdvertiserCampaignsEmptyState onCreateClick={handleCreateClick} />
      )}

      <CreateCampaignDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
