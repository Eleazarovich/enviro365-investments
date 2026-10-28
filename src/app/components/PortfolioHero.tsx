'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { usePortfolio } from '@/lib/PortfolioProvider';
import { formatRand } from '@/lib/format';
import Skeleton from '@/components/ui/Skeleton';

export default function PortfolioHero() {
  const { portfolio, loading, error } = usePortfolio();

  return (
    <section
      aria-labelledby="portfolio-heading"
      className="hero-glow relative overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Enviro365 Investments
          </p>
          <h1 id="portfolio-heading" className="mt-2 text-2xl font-semibold tracking-tight">
            Your portfolio
          </h1>
          <div className="mt-6">
            {loading && !portfolio ? (
              <Skeleton className="h-14 w-64" />
            ) : error && !portfolio ? (
              <p className="text-sm text-muted-foreground">Balance unavailable right now.</p>
            ) : (
              <p className="tabular text-balance-xl font-bold text-foreground">
                {portfolio ? formatRand(portfolio?.totalAvailable) : ''}
              </p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              Total available across your investments
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Balances update as soon as you submit a withdrawal</span>
        </div>
      </div>
    </section>
  );
}