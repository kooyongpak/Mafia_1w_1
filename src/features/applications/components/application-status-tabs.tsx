'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ApplicationStatus } from '../lib/dto';

interface ApplicationStatusTabsProps {
  value: ApplicationStatus | 'all';
  onChange: (value: ApplicationStatus | 'all') => void;
}

/**
 * 지원 상태 필터 탭
 * 전체/대기중/선정됨/미선정 필터
 */
export const ApplicationStatusTabs = ({ value, onChange }: ApplicationStatusTabsProps) => {
  const handleChange = (newValue: string) => {
    onChange(newValue as ApplicationStatus | 'all');
  };

  return (
    <Tabs value={value} onValueChange={handleChange}>
      <TabsList>
        <TabsTrigger value="all">전체</TabsTrigger>
        <TabsTrigger value="pending">대기중</TabsTrigger>
        <TabsTrigger value="selected">선정됨</TabsTrigger>
        <TabsTrigger value="rejected">미선정</TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
