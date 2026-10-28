import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { InvestmentProduct } from '@/lib/types';
import { formatRand } from '@/lib/format';
import ProductTypeTag from '@/components/ProductTypeTag';
import Button from '@/components/ui/Button';

interface InvestmentSummaryProps {
  product: InvestmentProduct;
  onWithdraw: () => void;
}

export default function InvestmentSummary({ product, onWithdraw }: InvestmentSummaryProps) {
  const cannotWithdraw = product.maximumWithdrawable <= 0;

  return (
    <section
      aria-labelledby="investment-heading"
      className="hero-glow rounded-2xl border border-border bg-card p-6 sm:p-8"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <ProductTypeTag type={product.type} />
          <h1 id="investment-heading" className="mt-3 text-2xl font-semibold tracking-tight">
            {product.name}
          </h1>
          <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Available balance
          </p>
          <p className="tabular mt-1 text-balance-xl font-bold">{formatRand(product.availableBalance)}</p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end lg:flex-col lg:items-end">
          <div className="rounded-xl bg-secondary/70 px-5 py-4 lg:text-right">
            <p className="text-sm text-muted-foreground">Maximum you can withdraw</p>
            <p className="tabular mt-0.5 text-xl font-bold">{formatRand(product.maximumWithdrawable)}</p>
          </div>
          <Button size="lg" onClick={onWithdraw} disabled={cannotWithdraw}>
            <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
            Withdraw money
          </Button>
        </div>
      </div>
      {cannotWithdraw && (
        <p className="mt-4 text-sm text-muted-foreground">
          You&apos;ve reached the withdrawal limit for this investment, so new withdrawals aren&apos;t
          available right now.
        </p>
      )}
    </section>
  );
}