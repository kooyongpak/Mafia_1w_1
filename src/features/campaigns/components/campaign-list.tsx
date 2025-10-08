'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CampaignCard } from './campaign-card';
import { CampaignFilters } from './campaign-filters';
import { CampaignPagination } from './campaign-pagination';
import { CampaignListSkeleton } from './campaign-list-skeleton';
import { CampaignEmptyState } from './campaign-empty-state';
import { useCampaigns } from '../hooks/useCampaigns';
import { CAMPAIGN_STATUS, CAMPAIGN_SORT, PAGINATION_DEFAULTS } from '@/constants/campaigns';
import type { CampaignSort } from '@/constants/campaigns';

export const CampaignList = () => {
  const [category, setCategory] = useState<string | undefined>();
  const [sort, setSort] = useState<CampaignSort>(CAMPAIGN_SORT.LATEST);
  const [page, setPage] = useState(PAGINATION_DEFAULTS.DEFAULT_PAGE);

  const { data, isLoading, error } = useCampaigns({
    status: CAMPAIGN_STATUS.RECRUITING,
    category,
    sort,
    page,
    limit: PAGINATION_DEFAULTS.DEFAULT_LIMIT,
  });

  const handleCategoryChange = (value: string) => {
    setCategory(value === 'all' ? undefined : value);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    setSort(value as CampaignSort);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setCategory(undefined);
    setSort(CAMPAIGN_SORT.LATEST);
    setPage(1);
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-16">
          <p className="text-red-600">체험단 목록을 불러오는데 실패했습니다.</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">모집 중인 체험단</h1>

      <CampaignFilters
        category={category}
        sort={sort}
        onCategoryChange={handleCategoryChange}
        onSortChange={handleSortChange}
      />

      {isLoading && <CampaignListSkeleton />}

      {!isLoading && data && data.data.length === 0 && (
        <CampaignEmptyState hasFilters={!!category} onReset={handleResetFilters} />
      )}

      {!isLoading && data && data.data.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.data.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>

          <CampaignPagination pagination={data.pagination} onPageChange={handlePageChange} />
        </>
      )}
    </div>
  );
};

