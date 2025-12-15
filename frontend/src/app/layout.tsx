'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import AuthProvider from '@/components/AuthProvider';

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
      <head>
        <link rel="icon" href="/galaxy logo.png" type="image/png" />
      </head>
      <body className={inter.className}>
        <Providers>
          <AuthProvider>
            {isLoginPage ? (
              children
            ) : (
              <div className="flex flex-col min-h-screen">
                <div className="flex flex-1">
                  <Sidebar />
                  <main className="flex-1 bg-gray-50">
                    {children}
                  </main>
                </div>
                <Footer />
              </div>
            )}
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
