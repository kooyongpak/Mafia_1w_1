'use client';

import Image from 'next/image';

type CampaignImageGalleryProps = {
  campaignId: string;
  title: string;
};

export const CampaignImageGallery = ({ campaignId, title }: CampaignImageGalleryProps) => {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg">
      <Image
        src={`https://picsum.photos/seed/${campaignId}/960/540`}
        alt={title}
        fill
        className="object-cover"
        priority
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    </div>
  );
};
