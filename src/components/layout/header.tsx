'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { User } from 'lucide-react';

export const Header = () => {
  const router = useRouter();
  const { isAuthenticated, user, refresh } = useCurrentUser();

  const userRole = user?.role;

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      await refresh();
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-900">
              체험단 플랫폼
            </Link>
          </div>

          <nav className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              체험단 목록
            </Link>

            {isAuthenticated ? (
              <>
                {userRole === 'influencer' && (
                  <Link
                    href="/applications"
                    className="text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    내 지원 목록
                  </Link>
                )}

                {userRole === 'advertiser' && (
                  <Link
                    href="/campaigns/manage"
                    className="text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    체험단 관리
                  </Link>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <User className="h-4 w-4" />
                      <span>{user?.email}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>내 계정</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {userRole === 'influencer' && (
                      <DropdownMenuItem asChild>
                        <Link href="/onboarding/influencer">프로필 관리</Link>
                      </DropdownMenuItem>
                    )}
                    {userRole === 'advertiser' && (
                      <DropdownMenuItem asChild>
                        <Link href="/onboarding/advertiser">프로필 관리</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">대시보드</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>로그아웃</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">로그인</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/signup">회원가입</Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
