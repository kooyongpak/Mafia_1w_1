'use client';

import { Button } from '@/components/ui/button';

type CampaignEmptyStateProps = {
  hasFilters: boolean;
  onReset?: () => void;
};

export const CampaignEmptyState = ({ hasFilters, onReset }: CampaignEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-center space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">
          {hasFilters ? '조건에 맞는 체험단이 없습니다' : '현재 모집 중인 체험단이 없습니다'}
        </h3>
        <p className="text-gray-600 max-w-md">
          {hasFilters ? '다른 조건으로 검색해 보세요.' : '곧 새로운 체험단이 등록될 예정입니다.'}
        </p>
        {hasFilters && onReset && (
          <Button onClick={onReset} variant="outline">
            필터 초기화
          </Button>
        )}
      </div>
    </div>
  );
};

