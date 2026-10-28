'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, History } from 'lucide-react';
import { api } from '@/lib/api';
import { usePortfolio } from '@/lib/PortfolioProvider';
import type { WithdrawalNotice } from '@/lib/types';
import WithdrawalTable from '@/components/WithdrawalTable';
import Skeleton from '@/components/ui/Skeleton';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';

export default function RecentActivityPanel() {
  const { historyVersion } = usePortfolio();
  const [rows, setRows] = useState<WithdrawalNotice[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.getWithdrawals();
      setRows(data.slice(0, 4));
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't load your recent withdrawals.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, historyVersion]);

  return (
    <section aria-labelledby="recent-heading" className="panel">
      <div className="panel-heading">
        <h2 id="recent-heading" className="text-sm font-semibold tracking-tight">
          Recent withdrawals
        </h2>
        <Link href="/withdrawal-history" className="text-link group">
          View all
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>

      {error ? (
        <div className="p-6">
          <ErrorState message={error} onRetry={load} />
        </div>
      ) : rows === null ? (
        <div className="space-y-3 p-6" aria-hidden="true">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<History className="h-6 w-6" aria-hidden="true" />}
          title="No withdrawals yet"
          description="Your withdrawals will appear here."
        />
      ) : (
        <WithdrawalTable rows={rows} caption="Your most recent withdrawals" />
      )}
    </section>
  );
}
