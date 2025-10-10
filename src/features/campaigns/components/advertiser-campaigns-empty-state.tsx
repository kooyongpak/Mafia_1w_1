'use client';

import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface AdvertiserCampaignsEmptyStateProps {
  onCreateClick: () => void;
}

export const AdvertiserCampaignsEmptyState = ({ onCreateClick }: AdvertiserCampaignsEmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <FileText className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">아직 등록한 체험단이 없습니다</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        첫 체험단을 등록하고 인플루언서들과 함께 브랜드를 홍보하세요.
      </p>
      <Button onClick={onCreateClick}>
        첫 체험단 등록하기
      </Button>
    </div>
  );
};
