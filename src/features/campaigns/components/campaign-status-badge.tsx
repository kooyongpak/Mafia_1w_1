'use client';

import { Badge } from '@/components/ui/badge';
import { STATUS_BADGE_VARIANTS } from '@/constants/campaigns';
import { calculateDday, formatDday, isDeadlineNear } from '@/lib/utils/date';

type CampaignStatusBadgeProps = {
  status: string;
  recruitmentEndDate: string;
  applicationsCount?: number;
};

export const CampaignStatusBadge = ({
  status,
  recruitmentEndDate,
  applicationsCount = 0,
}: CampaignStatusBadgeProps) => {
  const statusConfig = STATUS_BADGE_VARIANTS[status as keyof typeof STATUS_BADGE_VARIANTS] || {
    variant: 'secondary' as const,
    label: status,
  };

  const dday = calculateDday(recruitmentEndDate);
  const showDday = status === 'recruiting' && isDeadlineNear(dday);
  const showPopular = applicationsCount > 20;

  return (
    <div className="flex gap-2">
      <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
      {showDday && <Badge variant="destructive">{formatDday(dday)}</Badge>}
      {showPopular && <Badge variant="default">인기</Badge>}
    </div>
  );
};
