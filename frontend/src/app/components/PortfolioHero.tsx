'use client';

import { usePortfolio } from '@/lib/PortfolioProvider';
import Skeleton from '@/components/ui/Skeleton';
import BalanceAmount from '@/components/ui/BalanceAmount';

export default function PortfolioHero() {
  const { portfolio, loading, error } = usePortfolio();

  return (
    <section aria-labelledby="portfolio-heading">
      <div className="mb-6">
        <h1 id="portfolio-heading" className="page-heading">
          Portfolio value
        </h1>
        {portfolio?.investor.investorSince && (
          <p className="mt-2 text-sm text-muted-foreground">
            Investor since{' '}
            <time dateTime={portfolio.investor.investorSince}>
              {new Date(portfolio.investor.investorSince).toLocaleDateString('en-ZA', {
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC',
              })}
            </time>
          </p>
        )}
      </div>

      <div className="relative isolate overflow-hidden rounded-2xl bg-card px-6 py-7 text-foreground ring-1 ring-inset ring-border sm:px-8 sm:py-8">
        <div className="portfolio-motif -z-10" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <p className="text-xs font-medium text-muted-foreground">Total available balance</p>
        <div className="mt-4 min-h-[62px]">
          {loading && !portfolio ? (
            <Skeleton className="h-14 w-56" />
          ) : error && !portfolio ? (
            <p className="py-3 text-sm text-muted-foreground">Balance unavailable right now.</p>
          ) : (
            portfolio && <BalanceAmount value={portfolio.totalAvailable} />
          )}
        </div>
      </div>
    </section>
  );
}
