import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import {
  GetCampaignsResponseSchema,
  type GetCampaignsQuery,
  type GetCampaignsResponse,
} from '../lib/dto';

const fetchCampaigns = async (params: GetCampaignsQuery): Promise<GetCampaignsResponse> => {
  try {
    const response = await apiClient.get('/campaigns', { params });
    const validated = GetCampaignsResponseSchema.parse(response.data);
    return validated;
  } catch (error) {
    console.error('Campaign fetch error:', error);
    throw error;
  }
};

export const useCampaigns = (params: GetCampaignsQuery) => {
  return useQuery({
    queryKey: ['campaigns', params],
    queryFn: () => fetchCampaigns(params),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
};

