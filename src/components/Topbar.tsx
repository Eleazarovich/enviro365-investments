'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
      ? 'Withdrawals'
      : pathname === '/investment-detail'
        ? 'Investment details'
        : 'Portfolio';

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-[73px] max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        <Link
          href="/"
          aria-label="Enviro365 Investments home"
          className="flex items-center gap-2 rounded-md lg:hidden"
        >
          <span className="rounded-lg bg-primary p-1 text-primary-foreground">
            <AppLogo size={28} />
          </span>
          <span className="text-base font-semibold tracking-tight">
            enviro<span className="font-normal text-primary">365</span>
          </span>
        </Link>
        <p className="hidden text-xs font-medium lg:block">{page}</p>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-medium">{portfolio?.investor.name || 'Your account'}</p>
          </div>
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary text-[11px] font-medium text-primary"
          >
            {initials || '··'}
          </span>
        </div>
      </div>
    </header>
  );
}
