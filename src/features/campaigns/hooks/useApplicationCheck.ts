'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { CheckApplicationResponseSchema, type CheckApplicationResponse } from '../lib/dto';

const fetchApplicationCheck = async (campaignId: string, userId: string): Promise<CheckApplicationResponse> => {
  try {
    const response = await apiClient.get('/applications/check', {
      params: { campaign_id: campaignId, user_id: userId }
    });
    const validated = CheckApplicationResponseSchema.parse(response.data);
    return validated;
  } catch (error) {
    console.error('Application check error:', error);
    throw error;
  }
};

export const useApplicationCheck = (campaignId: string, userId?: string) => {
  return useQuery({
    queryKey: ['application-check', campaignId, userId],
    queryFn: () => {
      if (!userId) {
        return Promise.resolve({ applied: false, application: null });
      }
      return fetchApplicationCheck(campaignId, userId);
    },
    enabled: !!campaignId,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};
