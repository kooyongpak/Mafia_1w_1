'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

/**
 * 지원 내역 없음 상태
 */
export const ApplicationsEmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FileQuestion className="h-16 w-16 text-gray-400 mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        아직 지원한 체험단이 없습니다
      </h3>
      <p className="text-gray-600 mb-6">
        다양한 체험단에 지원하고 특별한 경험을 시작해보세요
      </p>
      <Button asChild>
        <Link href="/">체험단 둘러보기</Link>
      </Button>
    </div>
  );
};
