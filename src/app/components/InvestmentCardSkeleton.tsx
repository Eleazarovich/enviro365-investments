import React from 'react';
import Skeleton from '@/components/ui/Skeleton';

export default function InvestmentCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6" aria-hidden="true">
      <Skeleton className="h-6 w-44" />
      <Skeleton className="mt-3 h-6 w-32 rounded-full" />
      <Skeleton className="mt-7 h-4 w-28" />
      <Skeleton className="mt-2 h-9 w-48" />
      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="mt-6 h-5 w-32" />
    </div>
  );
}