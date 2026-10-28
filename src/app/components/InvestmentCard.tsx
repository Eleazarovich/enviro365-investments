import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { InvestmentProduct } from '@/lib/types';
import { formatRand } from '@/lib/format';
import ProductTypeTag from '@/components/ProductTypeTag';

export default function InvestmentCard({ product }: { product: InvestmentProduct }) {
  return (
    <Link
      href={`/investment-detail?id=${product.id}`}
      className="group block rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">{product.name}</h3>
          <div className="mt-2">
            <ProductTypeTag type={product.type} />
          </div>
        </div>
      </div>

      <div className="mt-7">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Available balance
        </p>
        <p className="tabular mt-1 text-3xl font-bold tracking-tight">
          {formatRand(product.availableBalance)}
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
        <div>
          <dt className="text-muted-foreground">Maximum you can withdraw</dt>
          <dd className="tabular mt-0.5 font-semibold">{formatRand(product.maximumWithdrawable)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Waiting to be processed</dt>
          <dd className="tabular mt-0.5 font-semibold">
            {product.pendingWithdrawals > 0 ? formatRand(product.pendingWithdrawals) : 'None'}
          </dd>
        </div>
      </dl>

      <div className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-primary">
        View investment
        <ArrowRight
          className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
          aria-hidden="true"
        />
      </div>
    </Link>
  );
}