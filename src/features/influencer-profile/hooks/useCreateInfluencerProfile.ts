import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { CreateInfluencerProfileRequest, CreateInfluencerProfileResponse } from '../lib/dto';

export const useCreateInfluencerProfile = () => {
  return useMutation({
    mutationFn: async (data: CreateInfluencerProfileRequest) => {
      const response = await apiClient.post<CreateInfluencerProfileResponse>(
        '/influencer/profile',
        data,
      );
      return response;
    },
  });
};
