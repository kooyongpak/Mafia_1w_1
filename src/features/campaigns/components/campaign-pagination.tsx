'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMeta } from '../lib/dto';

type CampaignPaginationProps = {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
};

export const CampaignPagination = ({ pagination, onPageChange }: CampaignPaginationProps) => {
  const { page, total_pages } = pagination;

  if (total_pages <= 1) return null;

  const canGoPrevious = page > 1;
  const canGoNext = page < total_pages;

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(page - 1)}
        disabled={!canGoPrevious}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="text-sm text-gray-600 px-4">
        {page} / {total_pages}
      </span>

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(page + 1)}
        disabled={!canGoNext}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

