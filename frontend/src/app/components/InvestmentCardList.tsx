'use client';

import React from 'react';
import { Briefcase } from 'lucide-react';
import { usePortfolio } from '@/lib/PortfolioProvider';
import InvestmentCard from './InvestmentCard';
import InvestmentCardSkeleton from './InvestmentCardSkeleton';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';

export default function InvestmentCardList() {
  const { portfolio, loading, error, refresh } = usePortfolio();

  return (
    <section aria-labelledby="investments-heading" aria-busy={loading}>
      <div className="mb-4 flex items-center gap-2.5">
        <h2 id="investments-heading" className="text-base font-semibold tracking-tight">
          Your investments
        </h2>
        {portfolio && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-md border border-border bg-card px-1 text-[10px] font-medium text-muted-foreground">
            {portfolio.products.length}
          </span>
        )}
      </div>
      {loading && !portfolio ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <InvestmentCardSkeleton />
          <InvestmentCardSkeleton />
        </div>
      ) : error && !portfolio ? (
        <ErrorState title="We couldn't load your investments" message={error} onRetry={refresh} />
      ) : portfolio && portfolio?.products?.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<Briefcase className="h-6 w-6" aria-hidden="true" />}
            title="No investments yet"
            description="Your investments will appear here once they are set up on your account."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {portfolio?.products?.map((product) => (
            <InvestmentCard key={`product-${product?.id}`} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
