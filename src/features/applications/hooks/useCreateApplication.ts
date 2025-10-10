'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { CreateApplicationRequest, CreateApplicationResponse } from '../lib/dto';

/**
 * 체험단 지원서 생성 API 호출
 */
const createApplication = async (
  data: CreateApplicationRequest,
): Promise<CreateApplicationResponse> => {
  const response = await apiClient.post<{
    ok: boolean;
    data?: CreateApplicationResponse;
    error?: { code: string; message: string };
  }>('/applications', data);

  if (!response.data.ok || !response.data.data) {
    throw new Error(response.data.error?.message || '지원서 생성에 실패했습니다.');
  }

  return response.data.data;
};

/**
 * 체험단 지원서 생성 mutation hook
 *
 * @returns useMutation result
 */
export const useCreateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createApplication,
    onSuccess: (data) => {
      // Invalidate application check query for this campaign
      queryClient.invalidateQueries({
        queryKey: ['application-check', data.campaign_id],
      });

      // Invalidate applications list if it exists
      queryClient.invalidateQueries({
        queryKey: ['applications'],
      });
    },
    retry: false,
  });
};
