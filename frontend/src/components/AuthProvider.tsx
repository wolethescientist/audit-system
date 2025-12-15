'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isInitialized, initializeAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  const isPublicPage = pathname === '/login' || pathname === '/';

  useEffect(() => {
    const init = async () => {
      await initializeAuth();
      setIsLoading(false);
    };
    init();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isInitialized) return;

    // Redirect to login if not authenticated and not on public page
    if (!user && !isPublicPage) {
      router.push('/login');
    }
  }, [isInitialized, user, isPublicPage, router]);

  // Show loading state while initializing
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-primary-200 rounded-full"></div>
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Allow public pages without auth
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Block protected pages if not authenticated
  if (!user) {
    return null;
  }

  return <>{children}</>;
}
