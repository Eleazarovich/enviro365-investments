'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { History, SearchX } from 'lucide-react';
import { api } from '@/lib/api';
import { usePortfolio } from '@/lib/PortfolioProvider';
import type { WithdrawalFilters, WithdrawalNotice } from '@/lib/types';
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
  const [loadedFilters, setLoadedFilters] = useState<WithdrawalFilters | null>(null);
  const requestVersion = useRef(0);

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
    const version = ++requestVersion.current;
    if (invalidRange) {
      setReloading(false);
      return;
    }
    setError(null);
    setReloading(true);
    try {
      // Backend integration: GET /api/investors/1/withdrawal-notices?productId&fromDate&toDate
      const data = await api.getWithdrawals(apiFilters);
      if (version !== requestVersion.current) return;
      setRows(data);
      setLoadedFilters(apiFilters);
    } catch (e) {
      if (version !== requestVersion.current) return;
      setError(
        e instanceof Error
          ? e.message
          : "We couldn't load your withdrawal history. Please try again."
      );
    } finally {
      if (version === requestVersion.current) setReloading(false);
    }
  }, [apiFilters, invalidRange]);

  useEffect(() => {
    void load();
    // Ignore older results, errors and loading changes after filters change or unmount.
    return () => {
      requestVersion.current += 1;
    };
  }, [load, historyVersion]);

  const handleReset = () => setFilters(EMPTY_FILTERS);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <DownloadStatementButton
          filters={apiFilters}
          disabled={
            rows === null ||
            loadedFilters !== apiFilters ||
            reloading ||
            invalidRange ||
            Boolean(error)
          }
          onResult={(m) => setToast({ id: Date.now(), ...m })}
        />
      </div>
      <div className="panel">
        <HistoryFilters
          products={portfolio?.products ?? []}
          value={filters}
          onChange={setFilters}
          onReset={handleReset}
          canReset={hasActiveFilters}
          invalidRange={invalidRange}
        />

        <section aria-label="Withdrawal history" aria-busy={reloading} className="overflow-hidden">
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
          ) : rows === null || loadedFilters !== apiFilters ? (
            <HistorySkeleton />
          ) : rows.length === 0 && hasActiveFilters ? (
            <EmptyState
              icon={<SearchX className="h-6 w-6" aria-hidden="true" />}
              title="No withdrawals match these filters"
              description="Try a different investment or a wider date range, or clear your selection to view all withdrawals."
              action={
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Clear selection
                </Button>
              }
            />
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<History className="h-6 w-6" aria-hidden="true" />}
              title="No withdrawals yet"
              description="Your withdrawals will appear here."
            />
          ) : (
            <div className={reloading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
              <WithdrawalTable rows={rows} caption="Your withdrawals, newest first" />
            </div>
          )}
        </section>
      </div>
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
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
