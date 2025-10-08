"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { InfluencerProfileForm } from "@/features/influencer-profile/components/influencer-profile-form";

type InfluencerOnboardingPageProps = {
  params: Promise<Record<string, never>>;
};

export default function InfluencerOnboardingPage({
  params,
}: InfluencerOnboardingPageProps) {
  void params;
  const router = useRouter();
  const { isAuthenticated, user } = useCurrentUser();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">인플루언서 정보 등록</h1>
      <p className="text-gray-600 mb-8">
        체험단에 지원하기 위해 인플루언서 정보를 등록해주세요.
      </p>
      <InfluencerProfileForm userId={user.id} />
    </div>
  );
}
