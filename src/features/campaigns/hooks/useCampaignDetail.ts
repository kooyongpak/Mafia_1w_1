'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { CampaignDetailSchema, type CampaignDetail } from '../lib/dto';

const fetchCampaignDetail = async (campaignId: string): Promise<CampaignDetail> => {
  try {
    const response = await apiClient.get(`/campaigns/${campaignId}`);
    const validated = CampaignDetailSchema.parse(response.data);
    return validated;
  } catch (error) {
    console.error('Campaign detail fetch error:', error);
    throw error;
  }
};

export const useCampaignDetail = (campaignId: string) => {
  return useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => fetchCampaignDetail(campaignId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    enabled: !!campaignId,
  });
};
