'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import AppLogo from './ui/AppLogo';
import { usePortfolio } from '@/lib/PortfolioProvider';

export default function Topbar() {
  const pathname = usePathname();
  const { portfolio } = usePortfolio();
  const initials = portfolio?.investor.name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2);
  const page =
    pathname === '/withdrawal-history'
      ? 'Withdrawal history'
      : pathname === '/investment-detail'
        ? 'Investment details'
        : 'Overview';

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-[73px] max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <Link
          href="/"
          aria-label="Enviro365 Investments home"
          className="flex items-center gap-2 rounded-md lg:hidden"
        >
          <span className="rounded-lg bg-[var(--forest)] p-1">
            <AppLogo size={28} />
          </span>
          <span className="text-base font-semibold tracking-tight">
            enviro<span className="font-normal text-primary">365</span>
          </span>
        </Link>
        <nav aria-label="Breadcrumb" className="hidden items-center gap-3 text-xs lg:flex">
          <Link
            href="/"
            className="rounded text-muted-foreground transition-colors hover:text-foreground"
          >
            Workspace
          </Link>
          <ChevronRight className="h-3 w-3 text-muted-foreground/60" aria-hidden="true" />
          <span aria-current="page" className="font-medium">
            {page}
          </span>
        </nav>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-medium">{portfolio?.investor.name || 'Investor account'}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Personal portfolio</p>
          </div>
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dce5d1] bg-secondary text-[11px] font-medium text-primary"
          >
            {initials || '··'}
          </span>
        </div>
      </div>
    </header>
  );
}
