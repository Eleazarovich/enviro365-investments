'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { navItems } from './navItems';
import { usePortfolio } from '@/lib/PortfolioProvider';
import Icon from '@/components/ui/AppIcon';


export default function Topbar() {
  const pathname = usePathname();
  const { portfolio } = usePortfolio();
  const initials = portfolio
    ? portfolio?.investor?.name?.split(' ')?.map((p) => p?.charAt(0))?.join('')?.slice(0, 2)
    : '';

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-16">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <AppLogo size={36} />
            <span className="text-base font-bold tracking-tight">Enviro365 Investments</span>
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {navItems?.map((item) => {
              const active = item?.matches?.includes(pathname);
              const Icon = item?.icon;
              return (
                <Link
                  key={item?.key}
                  href={item?.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active
                      ? 'bg-primary/10 text-primary' :'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item?.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {portfolio && (
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight">{portfolio?.investor?.name}</p>
              <p className="text-xs text-muted-foreground">Investor</p>
            </div>
          )}
          <div
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
          >
            {initials || '··'}
          </div>
        </div>
      </div>
    </header>
  );
}