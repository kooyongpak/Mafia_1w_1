'use client';

import { ApplicationCard } from './application-card';
import type { ApplicationWithCampaign } from '../lib/dto';

interface ApplicationsListProps {
  applications: ApplicationWithCampaign[];
}

/**
 * 지원 목록 그리드
 */
export const ApplicationsList = ({ applications }: ApplicationsListProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {applications.map((application) => (
        <ApplicationCard key={application.id} application={application} />
      ))}
    </div>
  );
};
