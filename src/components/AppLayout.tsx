'use client';

import React from 'react';
import Topbar from './Topbar';
import MobileTabBar from './MobileTabBar';
import { PortfolioProvider } from '@/lib/PortfolioProvider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortfolioProvider>
      <div className="min-h-screen bg-background">
        <Topbar />
        <main className="mx-auto w-full max-w-screen-2xl px-4 pb-28 pt-8 sm:px-6 md:pb-14 lg:px-8 xl:px-10 2xl:px-16">
          {children}
        </main>
        <MobileTabBar />
      </div>
    </PortfolioProvider>
  );
}