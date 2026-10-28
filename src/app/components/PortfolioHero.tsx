'use client';

import { RefreshCw } from 'lucide-react';
import { usePortfolio } from '@/lib/PortfolioProvider';
import Skeleton from '@/components/ui/Skeleton';
import BalanceAmount from '@/components/ui/BalanceAmount';

export default function PortfolioHero() {
  const { portfolio, loading, error } = usePortfolio();

  return (
    <section aria-labelledby="portfolio-heading">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Your investment overview</p>
          <h1 id="portfolio-heading" className="page-heading">
            Your portfolio
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A clear view of where you stand, and what comes next.
          </p>
        </div>
        {portfolio && (
          <p className="mb-0.5 text-xs text-muted-foreground">
            Welcome back,{' '}
            <span className="font-medium text-foreground">
              {portfolio.investor.name.split(' ')[0]}.
            </span>
          </p>
        )}
      </div>

      <div className="relative isolate overflow-hidden rounded-2xl bg-[var(--forest)] px-6 py-7 text-white sm:px-8 sm:py-8">
        <div className="portfolio-motif -z-10" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-medium text-[#c2d0bd]">Total available balance</p>
          <span className="rounded-md border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-medium tracking-wider text-[#d9e4d4]">
            ZAR
          </span>
        </div>
        <div className="mt-4 min-h-[62px]">
          {loading && !portfolio ? (
            <Skeleton className="h-14 w-56 !bg-white/10" />
          ) : error && !portfolio ? (
            <p className="py-3 text-sm text-[#d9e4d4]">Balance unavailable right now.</p>
          ) : (
            portfolio && <BalanceAmount value={portfolio.totalAvailable} />
          )}
        </div>
        <div className="mt-5 flex flex-col gap-3 border-t border-white/15 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#c2d0bd]">Across your investments</p>
          <p className="flex items-start gap-2 text-[11px] leading-relaxed text-[#c2d0bd]">
            <RefreshCw className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
            Balances update when you submit a withdrawal
          </p>
        </div>
      </div>
    </section>
  );
}
