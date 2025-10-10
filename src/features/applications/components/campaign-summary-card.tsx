'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Gift } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

interface CampaignSummaryCardProps {
  campaign: {
    title?: string;
    recruitment_start_date?: string;
    recruitment_end_date?: string;
    benefits?: string;
    store_info?: string;
    status?: string;
  };
}

/**
 * 체험단 요약 카드
 * 지원 페이지 상단에 표시되는 체험단 정보
 */
export const CampaignSummaryCard = ({ campaign }: CampaignSummaryCardProps) => {
  if (
    !campaign.recruitment_start_date ||
    !campaign.recruitment_end_date ||
    !campaign.title ||
    !campaign.store_info ||
    !campaign.benefits
  ) {
    return null;
  }

  const startDate = parseISO(campaign.recruitment_start_date);
  const endDate = parseISO(campaign.recruitment_end_date);

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{campaign.title}</CardTitle>
          <Badge variant="default">모집중</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-medium">모집 기간: </span>
            {format(startDate, 'yyyy년 M월 d일', { locale: ko })} -{' '}
            {format(endDate, 'yyyy년 M월 d일', { locale: ko })}
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm text-gray-600">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-medium">장소: </span>
            {campaign.store_info}
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm text-gray-600">
          <Gift className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-medium">혜택: </span>
            {campaign.benefits}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
