'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import BottomNav from '@/components/layout/BottomNav';
import { useAuth } from '@/lib/useAuth';

const PUBLIC_PATHS = new Set(['/login']);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublic = PUBLIC_PATHS.has(pathname);

  useEffect(() => {
    if (!configured) return;
    if (loading) return;
    if (!user && !isPublic) {
      router.replace('/login');
    }
  }, [configured, loading, user, isPublic, router]);

  if (!configured) {
    return (
      <>
        {children}
        {!isPublic && <BottomNav />}
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">불러오는 중...</div>
      </div>
    );
  }

  if (!user && !isPublic) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">로그인 페이지로 이동 중...</div>
      </div>
    );
  }

  return (
    <>
      {children}
      {!isPublic && user && <BottomNav />}
    </>
  );
}
