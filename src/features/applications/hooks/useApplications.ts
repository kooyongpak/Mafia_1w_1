'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { GetApplicationsQuery, GetApplicationsResponse } from '../lib/dto';

/**
 * 체험단 지원 목록 조회 API 호출
 */
const fetchApplications = async (query: GetApplicationsQuery): Promise<GetApplicationsResponse> => {
  const response = await apiClient.get<{
    ok: boolean;
    data?: GetApplicationsResponse;
    error?: { code: string; message: string };
  }>('/applications', {
    params: query,
  });

  if (!response.data.ok || !response.data.data) {
    throw new Error(response.data.error?.message || '지원 목록 조회에 실패했습니다.');
  }

  return response.data.data;
};

/**
 * 체험단 지원 목록 조회 hook
 *
 * @param query - 쿼리 파라미터 (status, page, limit)
 * @returns useQuery result
 */
export const useApplications = (query: GetApplicationsQuery) => {
  return useQuery({
    queryKey: ['applications', query],
    queryFn: () => fetchApplications(query),
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};
