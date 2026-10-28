import Skeleton from '@/components/ui/Skeleton';

export default function InvestmentDetailSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading investment details">
      <Skeleton className="h-4 w-32" />
      <div>
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-9 w-64 max-w-full" />
      </div>
      <div className="rounded-2xl bg-[var(--forest)] p-6 sm:p-8">
        <Skeleton className="h-3 w-28 !bg-white/10" />
        <Skeleton className="mt-5 h-14 w-56 max-w-full !bg-white/10" />
        <Skeleton className="mt-4 h-3 w-44 !bg-white/10" />
      </div>
      <div className="panel p-6">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="mt-6 h-2 w-full" />
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
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
