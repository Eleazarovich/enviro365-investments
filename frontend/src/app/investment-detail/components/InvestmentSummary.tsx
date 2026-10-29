import { ArrowUpRight } from 'lucide-react';
import type { InvestmentProduct } from '@/lib/types';
import { formatRandPrecise } from '@/lib/format';
import ProductTypeTag from '@/components/ProductTypeTag';
import Button from '@/components/ui/Button';
import BalanceAmount from '@/components/ui/BalanceAmount';

interface InvestmentSummaryProps {
  product: InvestmentProduct;
  onWithdraw: () => void;
  withdrawalDisabled?: boolean;
}

export default function InvestmentSummary({
  product,
  onWithdraw,
  withdrawalDisabled = false,
}: InvestmentSummaryProps) {
  const cannotWithdraw = product.maximumWithdrawable <= 0;

  return (
    <section aria-labelledby="investment-heading">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
        <h1 id="investment-heading" className="page-heading">
          {product.name}
        </h1>
        <ProductTypeTag type={product.type} />
      </div>
      <div className="relative isolate overflow-hidden rounded-2xl bg-card p-6 text-foreground ring-1 ring-inset ring-border sm:p-8">
        <div className="portfolio-motif -z-10 opacity-60" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Available balance</p>
            <BalanceAmount value={product.availableBalance} className="mt-4" />
          </div>
          <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-stretch lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div>
              <p className="text-xs text-muted-foreground">
                {cannotWithdraw ? 'Minimum you can withdraw' : 'Maximum you can withdraw'}
              </p>
              <p className="tabular mt-1.5 text-2xl font-medium text-foreground">
                {formatRandPrecise(
                  cannotWithdraw ? product.minimumWithdrawable : product.maximumWithdrawable
                )}
              </p>
            </div>
            <Button
              variant="accent"
              onClick={onWithdraw}
              disabled={cannotWithdraw || withdrawalDisabled}
            >
              Withdraw money <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
