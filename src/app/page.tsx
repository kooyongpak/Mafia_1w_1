'use client';

import { CampaignList } from '@/features/campaigns/components/campaign-list';

export default function Home() {
  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">모집 중인 체험단</h1>
          <p className="text-gray-600">다양한 체험단에 지원하고 특별한 경험을 해보세요</p>
        </div>
        <CampaignList />
      </div>
    </div>
  );
}
