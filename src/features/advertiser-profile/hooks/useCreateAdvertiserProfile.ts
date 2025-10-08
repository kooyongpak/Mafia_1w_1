import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import {
  CreateAdvertiserProfileResponseSchema,
  type CreateAdvertiserProfileRequest,
  type CreateAdvertiserProfileResponse,
} from '../lib/dto';

const createAdvertiserProfile = async (
  data: CreateAdvertiserProfileRequest,
): Promise<CreateAdvertiserProfileResponse> => {
  const response = await apiClient.post('/advertiser/profile', data);
  return CreateAdvertiserProfileResponseSchema.parse(response.data);
};

export const useCreateAdvertiserProfile = () => {
  return useMutation({
    mutationFn: createAdvertiserProfile,
  });
};

