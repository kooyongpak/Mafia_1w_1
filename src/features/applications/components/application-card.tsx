'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ApplicationStatusBadge } from './application-status-badge';
import { Calendar, Clock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { ApplicationWithCampaign } from '../lib/dto';

interface ApplicationCardProps {
  application: ApplicationWithCampaign;
}

/**
 * 지원 내역 카드
 * 체험단 정보 + 지원 정보 표시
 */
export const ApplicationCard = ({ application }: ApplicationCardProps) => {
  const { campaign, message, visit_date, status, created_at } = application;

  return (
    <Link href={`/campaigns/${campaign.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold line-clamp-2 flex-1">{campaign.title}</h3>
            <ApplicationStatusBadge status={status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>
              {format(parseISO(campaign.recruitment_start_date), 'yy.MM.dd')} -{' '}
              {format(parseISO(campaign.recruitment_end_date), 'yy.MM.dd')}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>방문 예정: {format(parseISO(visit_date), 'yyyy.MM.dd')}</span>
          </div>

          <p className="text-sm text-gray-700 line-clamp-2">{message}</p>

          <p className="text-xs text-gray-500">
            지원일: {format(parseISO(created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
};
