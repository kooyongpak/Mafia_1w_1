'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

type CampaignListSkeletonProps = {
  count?: number;
};

export const CampaignListSkeleton = ({ count = 12 }: CampaignListSkeletonProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="p-0">
            <div className="aspect-video w-full bg-gray-200 animate-pulse" />
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-6 w-3/4 bg-gray-200 animate-pulse rounded mb-2" />
            <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded mb-1" />
            <div className="h-3 w-2/3 bg-gray-200 animate-pulse rounded" />
          </CardContent>
          <CardFooter className="p-4 pt-0 flex justify-between">
            <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
            <div className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

