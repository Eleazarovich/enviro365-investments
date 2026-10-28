import React from 'react';
import Skeleton from '@/components/ui/Skeleton';

export default function InvestmentDetailSkeleton() {
  return (
    <div className="space-y-8" aria-hidden="true">
      <Skeleton className="h-5 w-40" />
      <div className="rounded-2xl border border-border bg-card p-8">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="mt-4 h-8 w-64" />
        <Skeleton className="mt-8 h-4 w-32" />
        <Skeleton className="mt-2 h-14 w-72" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="mt-5 h-3 w-full rounded-full" />
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="space-y-3 rounded-2xl border border-border bg-card p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}