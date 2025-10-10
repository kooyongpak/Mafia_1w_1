'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CATEGORY_LABELS } from '@/constants/categories';
import { formatDateRange } from '@/lib/utils/date';
import { CampaignStatusBadge } from './campaign-status-badge';
import { CampaignImageGallery } from './campaign-image-gallery';
import { CampaignActionButton } from './campaign-action-button';
import type { CampaignDetail, CheckApplicationResponse } from '../lib/dto';

type CampaignDetailViewProps = {
  campaign: CampaignDetail;
  applicationCheck: CheckApplicationResponse;
  hasInfluencerProfile: boolean;
};

export const CampaignDetailView = ({
  campaign,
  applicationCheck,
  hasInfluencerProfile,
}: CampaignDetailViewProps) => {
  const dateRange = formatDateRange(campaign.recruitment_start_date, campaign.recruitment_end_date);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <CampaignImageGallery campaignId={campaign.id} title={campaign.title} />
        </div>

        <div className="space-y-6">
          <div>
            <CampaignStatusBadge
              status={campaign.status}
              recruitmentEndDate={campaign.recruitment_end_date}
              applicationsCount={campaign.applications_count}
            />
            <h1 className="text-3xl font-bold mt-4 mb-2">{campaign.title}</h1>
            {campaign.description && (
              <p className="text-gray-600 whitespace-pre-wrap">{campaign.description}</p>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">광고주:</span>
              <span>{campaign.advertiser.company_name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">카테고리:</span>
              <span>
                {CATEGORY_LABELS[campaign.advertiser.category as keyof typeof CATEGORY_LABELS] ||
                  campaign.advertiser.category}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">위치:</span>
              <span>{campaign.advertiser.location}</span>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">모집 기간:</span>
              <span>{dateRange}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">모집 인원:</span>
              <span>{campaign.recruitment_count}명</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold">지원자 수:</span>
              <span className="text-blue-600 font-semibold">{campaign.applications_count}명</span>
            </div>
          </div>

          <Separator />

          <div>
            <h2 className="text-lg font-semibold mb-2">제공 혜택</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="whitespace-pre-wrap">{campaign.benefits}</p>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">미션</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="whitespace-pre-wrap">{campaign.mission}</p>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">매장 정보</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="whitespace-pre-wrap">{campaign.store_info}</p>
              </CardContent>
            </Card>
          </div>

          <CampaignActionButton
            campaign={campaign}
            applicationCheck={applicationCheck}
            hasInfluencerProfile={hasInfluencerProfile}
          />
        </div>
      </div>
    </div>
  );
};
