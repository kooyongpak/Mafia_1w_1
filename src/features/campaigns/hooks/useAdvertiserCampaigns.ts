'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { GetAdvertiserCampaignsQuery, GetAdvertiserCampaignsResponse } from '../lib/dto';

const fetchAdvertiserCampaigns = async (query: GetAdvertiserCampaignsQuery): Promise<GetAdvertiserCampaignsResponse> => {
  const response = await apiClient.get<GetAdvertiserCampaignsResponse>('/campaigns/my', {
    params: query,
  });

  if (!response.data) {
    throw new Error('체험단 목록 조회에 실패했습니다.');
  }

  return response.data;
};

export const useAdvertiserCampaigns = (query: GetAdvertiserCampaignsQuery) => {
  return useQuery({
    queryKey: ['advertiser-campaigns', query],
    queryFn: () => fetchAdvertiserCampaigns(query),
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
