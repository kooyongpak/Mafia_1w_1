'use client';

import { Badge } from '@/components/ui/badge';
import { APPLICATION_STATUS_BADGE_VARIANTS } from '../constants';
import type { ApplicationStatus } from '../lib/dto';

interface ApplicationStatusBadgeProps {
  status: ApplicationStatus;
}

/**
 * 지원 상태 뱃지
 * pending(대기중), selected(선정됨), rejected(미선정) 상태 표시
 */
export const ApplicationStatusBadge = ({ status }: ApplicationStatusBadgeProps) => {
  const config = APPLICATION_STATUS_BADGE_VARIANTS[status];

  if (!config) {
    return null;
  }

  return <Badge variant={config.variant}>{config.label}</Badge>;
};
