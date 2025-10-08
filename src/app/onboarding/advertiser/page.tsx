"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { AdvertiserProfileForm } from "@/features/advertiser-profile/components/advertiser-profile-form";

type AdvertiserOnboardingPageProps = {
  params: Promise<Record<string, never>>;
};

export default function AdvertiserOnboardingPage({
  params,
}: AdvertiserOnboardingPageProps) {
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
      <h1 className="text-2xl font-bold mb-6">광고주 정보 등록</h1>
      <p className="text-gray-600 mb-8">
        체험단을 등록하고 관리하기 위해 광고주 정보를 등록해주세요.
      </p>
      <AdvertiserProfileForm userId={user.id} />
    </div>
  );
}
