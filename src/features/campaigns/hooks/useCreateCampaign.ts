'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { CreateCampaignRequest, CreateCampaignResponse } from '../lib/dto';

const createCampaign = async (data: CreateCampaignRequest): Promise<CreateCampaignResponse> => {
  const response = await apiClient.post<CreateCampaignResponse>('/campaigns', data);

  if (!response.data) {
    throw new Error('체험단 생성에 실패했습니다.');
  }

  return response.data;
};

export const useCreateCampaign = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertiser-campaigns'] });
    },
    retry: false,
  });
};
