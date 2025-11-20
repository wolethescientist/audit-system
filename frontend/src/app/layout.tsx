'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: any;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login' || pathname === '/';

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {isLoginPage ? (
            children
          ) : (
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 bg-gray-50">
                {children}
              </main>
            </div>
          )}
        </Providers>
      </body>
    </html>
  );
}
