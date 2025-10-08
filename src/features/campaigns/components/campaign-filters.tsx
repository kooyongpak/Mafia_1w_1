'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CATEGORY_LABELS } from '@/constants/categories';
import { CAMPAIGN_SORT } from '@/constants/campaigns';

type CampaignFiltersProps = {
  category?: string;
  sort: string;
  onCategoryChange: (category: string) => void;
  onSortChange: (sort: string) => void;
};

const SORT_LABELS = {
  [CAMPAIGN_SORT.LATEST]: '최신순',
  [CAMPAIGN_SORT.DEADLINE]: '마감임박순',
  [CAMPAIGN_SORT.POPULAR]: '인기순',
};

export const CampaignFilters = ({
  category,
  sort,
  onCategoryChange,
  onSortChange,
}: CampaignFiltersProps) => {
  return (
    <div className="flex gap-4 mb-6">
      <Select value={category || 'all'} onValueChange={onCategoryChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="카테고리" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">전체 카테고리</SelectItem>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={onSortChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="정렬" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(SORT_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

