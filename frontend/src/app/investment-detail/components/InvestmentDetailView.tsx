'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Briefcase } from 'lucide-react';
import { api } from '@/lib/api';
import { usePortfolio } from '@/lib/PortfolioProvider';
import type { WithdrawalNotice } from '@/lib/types';
import ErrorState from '@/components/ui/ErrorState';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import Toast, { type ToastMessage } from '@/components/ui/Toast';
import InvestmentDetailSkeleton from './InvestmentDetailSkeleton';
import InvestmentSummary from './InvestmentSummary';
import LimitMeter from './LimitMeter';
import InvestmentHistoryPreview from './InvestmentHistoryPreview';
import WithdrawalDialog from './WithdrawalDialog';

export default function InvestmentDetailView() {
  const searchParams = useSearchParams();
  const productId = Number(searchParams.get('id') ?? '1');
  const { portfolio, loading, error, refresh, bumpHistory, historyVersion } = usePortfolio();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [history, setHistory] = useState<WithdrawalNotice[] | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<number | null>(null);

  const loadHistory = useCallback(async () => {
    setHistoryError(null);
    try {
      const data = await api.getWithdrawals({ productId });
      setHistory(data);
    } catch (e) {
      setHistoryError(
        e instanceof Error ? e.message : "We couldn't load your withdrawals for this investment."
      );
    }
  }, [productId]);

  useEffect(() => {
    setHistory(null);
    void loadHistory();
  }, [loadHistory, historyVersion]);

  const product = portfolio?.products.find((p) => p.id === productId);

  const handleSubmitted = useCallback(
    async (notice: WithdrawalNotice) => {
      setHighlightId(notice.id);
      // Refresh balances and history after the API accepts the withdrawal.
      await refresh();
      bumpHistory();
    },
    [refresh, bumpHistory]
  );

  if (loading && !portfolio) return <InvestmentDetailSkeleton />;

  if (error && !portfolio) {
    return (
      <div className="space-y-6">
        <BackLink />
        <ErrorState title="We couldn't load this investment" message={error} onRetry={refresh} />
      </div>
    );
  }

  if (!product || !portfolio) {
    return (
      <div className="space-y-6">
        <BackLink />
        <div className="rounded-2xl border border-border bg-card">
          <EmptyState
            icon={<Briefcase className="h-6 w-6" aria-hidden="true" />}
            title="Investment not found"
            description="We couldn't find that investment. Head back to your portfolio and choose one from the list."
            action={
              <Link href="/">
                <Button variant="outline" size="sm">
                  Back to portfolio
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink />
      {error ? (
        <ErrorState
          title="We couldn't refresh your balance"
          message="Your balance may be out of date. Try again before making another withdrawal."
          onRetry={refresh}
        />
      ) : (
        <InvestmentSummary
          product={product}
          onWithdraw={() => setDialogOpen(true)}
          withdrawalDisabled={loading}
        />
      )}
      {!error && <LimitMeter product={product} />}
      <InvestmentHistoryPreview
        rows={history}
        error={historyError}
        onRetry={loadHistory}
        highlightId={highlightId}
        productName={product.name}
      />

      <WithdrawalDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        product={product}
        investorAge={portfolio.investor.age}
        onSubmitted={handleSubmitted}
        onNotify={(m) => setToast({ id: Date.now(), ...m })}
      />
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-2 rounded-md text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ArrowLeft
        className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5"
        aria-hidden="true"
      />
      Back to portfolio
    </Link>
  );
}
