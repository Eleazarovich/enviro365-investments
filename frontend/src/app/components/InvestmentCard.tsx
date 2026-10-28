import Link from 'next/link';
import { ArrowUpRight, Landmark, Wallet } from 'lucide-react';
import type { InvestmentProduct } from '@/lib/types';
import { formatRandPrecise, productTypeLabel } from '@/lib/format';

export default function InvestmentCard({ product }: { product: InvestmentProduct }) {
  const retirement = product.type === 'RETIREMENT';
  const ProductIcon = retirement ? Landmark : Wallet;

  return (
    <Link
      href={`/investment-detail?id=${product.id}`}
      className="group block overflow-hidden rounded-2xl border border-border bg-card transition duration-200 hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <div className="relative isolate overflow-hidden bg-muted/60 px-5 pb-5 pt-5 sm:px-6">
        <div
          className="investment-art -z-10 text-muted-foreground"
          data-type={product.type}
          aria-hidden="true"
        >
          <span />
          <span />
          <span />
        </div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-primary">
              <ProductIcon className="h-[19px] w-[19px]" strokeWidth={1.5} aria-hidden="true" />
            </span>
            <div>
              <p className="text-[10px] font-medium text-muted-foreground">
                {productTypeLabel(product.type)}
              </p>
              <h3 className="mt-0.5 text-[15px] font-semibold tracking-tight">{product.name}</h3>
            </div>
          </div>
          <ArrowUpRight
            className="mt-1 h-4 w-4 shrink-0 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </div>
        <div className="mt-6">
          <p className="text-[11px] text-muted-foreground">Available balance</p>
          <p className="tabular mt-1 text-[32px] font-medium leading-tight tracking-[-0.045em]">
            {formatRandPrecise(product.availableBalance)}
          </p>
        </div>
      </div>
      <div className="px-5 py-5 sm:px-6">
        <dl className="text-xs">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="leading-relaxed text-muted-foreground">Maximum you can withdraw</dt>
            <dd className="tabular shrink-0 text-sm font-medium">
              {formatRandPrecise(product.maximumWithdrawable)}
            </dd>
          </div>
        </dl>
        <div className="mt-5 flex items-center justify-between border-t border-border pt-3.5 text-xs font-medium text-primary">
          View investment <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}
