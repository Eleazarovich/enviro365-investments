'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { History, Info, SearchX } from 'lucide-react';
import { api } from '@/lib/api';
import { usePortfolio } from '@/lib/PortfolioProvider';
import type { WithdrawalFilters, WithdrawalNotice } from '@/lib/types';
import { formatRandPrecise } from '@/lib/format';
import WithdrawalTable from '@/components/WithdrawalTable';
import Skeleton from '@/components/ui/Skeleton';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import Toast, { type ToastMessage } from '@/components/ui/Toast';
import HistoryFilters, { type FilterState } from './HistoryFilters';
import DownloadStatementButton from './DownloadStatementButton';

const EMPTY_FILTERS: FilterState = { productId: '', fromDate: '', toDate: '' };

export default function WithdrawalHistoryView() {
  const { portfolio, historyVersion } = usePortfolio();
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [rows, setRows] = useState<WithdrawalNotice[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const apiFilters: WithdrawalFilters = useMemo(
    () => ({
      productId: filters.productId ? Number(filters.productId) : undefined,
      fromDate: filters.fromDate || undefined,
      toDate: filters.toDate || undefined,
    }),
    [filters]
  );

  const hasActiveFilters = Boolean(filters.productId || filters.fromDate || filters.toDate);
  const invalidRange = Boolean(
    filters.fromDate && filters.toDate && filters.fromDate > filters.toDate
  );

  const load = useCallback(async () => {
    if (invalidRange) return;
    setError(null);
    setReloading(true);
    try {
      // Backend integration: GET /api/investors/1/withdrawal-notices?productId&fromDate&toDate
      const data = await api.getWithdrawals(apiFilters);
      setRows(data);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "We couldn't load your withdrawal history. Please try again."
      );
    } finally {
      setReloading(false);
    }
  }, [apiFilters, invalidRange]);

  useEffect(() => {
    void load();
  }, [load, historyVersion]);

  const total = useMemo(() => (rows ?? []).reduce((sum, r) => sum + r.amount, 0), [rows]);

  const handleReset = () => setFilters(EMPTY_FILTERS);

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow mb-2">Account activity</p>
          <h1 className="page-heading">Withdrawals</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            A record of your withdrawal requests, newest first.
          </p>
        </div>
        <DownloadStatementButton
          filters={apiFilters}
          disabled={rows === null || reloading || invalidRange || Boolean(error)}
          onResult={(m) => setToast({ id: Date.now(), ...m })}
        />
      </header>

      <div className="panel">
        <HistoryFilters
          products={portfolio?.products ?? []}
          value={filters}
          onChange={setFilters}
          onReset={handleReset}
          canReset={hasActiveFilters}
          invalidRange={invalidRange}
        />

        <section
          aria-labelledby="history-results-heading"
          aria-busy={reloading}
          className="overflow-hidden"
        >
          <div className="panel-heading">
            <h2 id="history-results-heading" className="text-sm font-semibold tracking-tight">
              {hasActiveFilters ? 'Filtered withdrawals' : 'All withdrawals'}
            </h2>
            {rows !== null && !error && !invalidRange && (
              <p className="text-xs text-muted-foreground" aria-live="polite">
                {rows.length} {rows.length === 1 ? 'withdrawal' : 'withdrawals'}
                {rows.length > 0 && (
                  <>
                    {' · '}
                    <span className="tabular font-semibold text-foreground">
                      {formatRandPrecise(total)}
                    </span>{' '}
                    in total
                  </>
                )}
              </p>
            )}
          </div>

          {invalidRange ? (
            <div className="p-6">
              <div
                role="alert"
                id="date-range-error"
                className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground"
              >
                The start date is after the end date. Change one of the dates to see your
                withdrawals.
              </div>
            </div>
          ) : error ? (
            <div className="p-6">
              <ErrorState
                title="We couldn't load your withdrawal history"
                message={error}
                onRetry={load}
              />
            </div>
          ) : rows === null ? (
            <HistorySkeleton />
          ) : rows.length === 0 && hasActiveFilters ? (
            <EmptyState
              icon={<SearchX className="h-6 w-6" aria-hidden="true" />}
              title="No withdrawals match these filters"
              description="Try a different investment or a wider date range, or reset the filters to see everything."
              action={
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Reset filters
                </Button>
              }
            />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<History className="h-6 w-6" aria-hidden="true" />}
              title="No withdrawals yet"
              description="When you withdraw money from one of your investments, the request will be listed here."
            />
          ) : (
            <div className={reloading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
              <WithdrawalTable rows={rows} caption="Your withdrawals, newest first" />
            </div>
          )}
        </section>
      </div>
      <p className="flex max-w-2xl items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Submitted records a request. It is not confirmation that money has reached your bank
        account.
      </p>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-3 p-6" aria-hidden="true">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}
