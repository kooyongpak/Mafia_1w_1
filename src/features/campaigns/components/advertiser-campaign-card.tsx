'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CampaignStatusBadge } from './campaign-status-badge';
import type { AdvertiserCampaign } from '../lib/dto';

interface AdvertiserCampaignCardProps {
  campaign: AdvertiserCampaign;
}

export const AdvertiserCampaignCard = ({ campaign }: AdvertiserCampaignCardProps) => {
  const startDate = format(new Date(campaign.recruitment_start_date), 'yyyy.MM.dd', { locale: ko });
  const endDate = format(new Date(campaign.recruitment_end_date), 'yyyy.MM.dd', { locale: ko });
  const createdAt = format(new Date(campaign.created_at), 'yyyy.MM.dd HH:mm', { locale: ko });

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2">{campaign.title}</CardTitle>
          <CampaignStatusBadge
            status={campaign.status}
            recruitmentEndDate={campaign.recruitment_end_date}
            applicationsCount={campaign.applications_count}
          />
        </div>
        <CardDescription className="line-clamp-2">
          {campaign.description || '설명 없음'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="text-sm">
          <span className="text-muted-foreground">모집 기간: </span>
          <span className="font-medium">{startDate} ~ {endDate}</span>
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">모집 인원: </span>
          <span className="font-medium">{campaign.recruitment_count}명</span>
        </div>
        <div className="text-sm">
          <span className="text-muted-foreground">지원 현황: </span>
          <span className="font-medium text-primary">{campaign.applications_count}명 지원</span>
        </div>
        <div className="text-sm text-muted-foreground">
          등록일: {createdAt}
        </div>
      </CardContent>

      <CardFooter>
        <Link href={`/campaigns/${campaign.id}`} className="w-full">
          <Button variant="outline" className="w-full">
            상세보기
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
