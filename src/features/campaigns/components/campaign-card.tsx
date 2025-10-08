'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { calculateDday, formatDday, isDeadlineNear, formatDateRange } from '@/lib/utils/date';
import { CATEGORY_LABELS } from '@/constants/categories';
import type { CampaignWithAdvertiser } from '../lib/dto';

type CampaignCardProps = {
  campaign: CampaignWithAdvertiser;
};

export const CampaignCard = ({ campaign }: CampaignCardProps) => {
  const dday = calculateDday(campaign.recruitment_end_date);
  const isNearDeadline = isDeadlineNear(dday);
  const dateRange = formatDateRange(campaign.recruitment_start_date, campaign.recruitment_end_date);

  return (
    <Link href={`/campaigns/${campaign.id}`}>
      <Card className="overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer">
        <CardHeader className="p-0">
          <div className="relative aspect-video">
            <Image
              src={`https://picsum.photos/seed/${campaign.id}/960/540`}
              alt={campaign.title}
              fill
              className="object-cover"
            />
            <div className="absolute top-2 left-2 flex gap-2">
              <Badge variant="secondary">
                {CATEGORY_LABELS[campaign.advertiser.category as keyof typeof CATEGORY_LABELS] ||
                  campaign.advertiser.category}
              </Badge>
              {isNearDeadline && <Badge variant="destructive">{formatDday(dday)}</Badge>}
              {campaign.applications_count > 20 && <Badge variant="default">인기</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg line-clamp-2 mb-2">{campaign.title}</h3>
          <p className="text-sm text-gray-600 mb-1">{campaign.advertiser.company_name}</p>
          <p className="text-xs text-gray-500">{dateRange}</p>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between text-sm">
          <span className="text-gray-600">모집 {campaign.recruitment_count}명</span>
          <span className="text-blue-600">{campaign.applications_count}명 지원</span>
        </CardFooter>
      </Card>
    </Link>
  );
};

