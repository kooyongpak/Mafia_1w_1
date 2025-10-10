'use client';

import { AdvertiserCampaignCard } from './advertiser-campaign-card';
import type { AdvertiserCampaign } from '../lib/dto';

interface AdvertiserCampaignsListProps {
  campaigns: AdvertiserCampaign[];
}

export const AdvertiserCampaignsList = ({ campaigns }: AdvertiserCampaignsListProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {campaigns.map((campaign) => (
        <AdvertiserCampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
};
