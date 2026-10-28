'use client';

import React from 'react';
import Topbar from './Topbar';
import MobileTabBar from './MobileTabBar';
import Sidebar from './Sidebar';
import { PortfolioProvider } from '@/lib/PortfolioProvider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PortfolioProvider>
      <div className="min-h-screen bg-background">
        <a
          href="#main-content"
          className="sr-only fixed left-4 top-4 z-[60] rounded-lg bg-card px-4 py-3 text-sm font-medium shadow-lg focus:not-sr-only"
        >
          Skip to content
        </a>
        <Sidebar />
        <div className="md:ml-[var(--sidebar-width)]">
          <Topbar />
          <main
            id="main-content"
            tabIndex={-1}
            className="mx-auto w-full max-w-[1440px] px-5 pb-28 pt-7 outline-none sm:px-8 sm:pt-9 md:pb-10 lg:px-10"
          >
            {children}
          </main>
          <footer className="mx-auto hidden max-w-[1440px] items-center justify-between px-8 pb-6 text-[10px] text-muted-foreground md:flex lg:px-10">
            <p>Enviro365 Investments</p>
            <p>All amounts in South African rand (ZAR)</p>
          </footer>
        </div>
        <MobileTabBar />
      </div>
    </PortfolioProvider>
  );
}
