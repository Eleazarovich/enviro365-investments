import React from 'react';
import Link from 'next/link';
import { ArrowRight, History } from 'lucide-react';
import type { WithdrawalNotice } from '@/lib/types';
import WithdrawalTable from '@/components/WithdrawalTable';
import Skeleton from '@/components/ui/Skeleton';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';

interface Props {
  rows: WithdrawalNotice[] | null;
  error: string | null;
  onRetry: () => void;
  highlightId: number | null;
  productName: string;
}

export default function InvestmentHistoryPreview({ rows, error, onRetry, highlightId, productName }: Props) {
  return (
    <section
      aria-labelledby="investment-history-heading"
      className="overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h2 id="investment-history-heading" className="text-base font-semibold tracking-tight">
          Withdrawals from this investment
        </h2>
        <Link
          href="/withdrawal-history"
          className="group flex items-center gap-1 rounded-md text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Full history
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>

      {error ? (
        <div className="p-6">
          <ErrorState message={error} onRetry={onRetry} />
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
          description="You haven't made any withdrawals from this investment yet."
        />
      ) : (
        <WithdrawalTable
          rows={rows}
          showInvestment={false}
          highlightId={highlightId}
          caption={`Withdrawals from ${productName}`}
        />
      )}
    </section>
  );
}