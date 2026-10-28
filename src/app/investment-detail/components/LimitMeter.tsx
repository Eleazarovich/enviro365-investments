import React from 'react';
import type { InvestmentProduct } from '@/lib/types';
import { formatRand } from '@/lib/format';

export default function LimitMeter({ product }: { product: InvestmentProduct }) {
  // The recorded balance is derived only for this visual. The server-provided
  // available balance and maximum remain the displayed figures.
  const recorded = product.availableBalance + product.pendingWithdrawals;
  const limitTotal = recorded * 0.9;
  const usedPct =
    limitTotal > 0 ? Math.min(100, (product.pendingWithdrawals / limitTotal) * 100) : 0;

  return (
    <section aria-labelledby="limit-heading" className="panel p-5 sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 id="limit-heading" className="text-sm font-semibold tracking-tight">
          Your withdrawal limit
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:mt-0">
          You can withdraw up to 90% of this investment in total
        </p>
      </div>

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(usedPct)}
        aria-label="Share of your withdrawal limit already requested"
        className="mt-6 h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${usedPct}%` }}
        />
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-5 text-xs sm:grid-cols-3">
        <div>
          <dt className="leading-relaxed text-muted-foreground">Already requested</dt>
          <dd className="tabular mt-2 text-lg font-medium">
            {formatRand(product.pendingWithdrawals)}
          </dd>
        </div>
        <div>
          <dt className="leading-relaxed text-muted-foreground">Still available to withdraw</dt>
          <dd className="tabular mt-2 text-lg font-medium">
            {formatRand(product.maximumWithdrawable)}
          </dd>
        </div>
        <div>
          <dt className="leading-relaxed text-muted-foreground">Total limit for this investment</dt>
          <dd className="tabular mt-2 text-lg font-medium">{formatRand(limitTotal)}</dd>
        </div>
      </dl>
    </section>
  );
}
