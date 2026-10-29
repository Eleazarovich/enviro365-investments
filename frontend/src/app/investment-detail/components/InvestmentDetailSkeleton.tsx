import Skeleton from '@/components/ui/Skeleton';

export default function InvestmentDetailSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading investment details">
      <Skeleton className="h-4 w-32" />
      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 sm:mb-6">
          <Skeleton className="h-9 w-64 max-w-full" />
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
        <div className="rounded-2xl bg-card p-6 ring-1 ring-inset ring-border sm:p-8">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Skeleton className="h-3 w-28" />
              <Skeleton className="mt-4 h-10 w-56 max-w-full" />
            </div>
            <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-stretch lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <div>
                <Skeleton className="h-3 w-36" />
                <Skeleton className="mt-1.5 h-8 w-32" />
              </div>
              <Skeleton className="h-10 w-full sm:w-40" />
            </div>
          </div>
        </div>
      </div>
      <div className="panel p-6">
        <Skeleton className="mb-6 h-4 w-52 max-w-full" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
