import Skeleton from '@/components/ui/Skeleton';

export default function InvestmentCardSkeleton() {
  return (
    <div className="panel" role="status" aria-label="Loading investment">
      <div className="bg-secondary/70 p-5 sm:px-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div>
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-4 w-36" />
          </div>
        </div>
        <Skeleton className="mt-6 h-3 w-24" />
        <Skeleton className="mt-2 h-10 w-44" />
      </div>
      <div className="p-5 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="mt-5 border-t border-border pt-4">
          <Skeleton className="h-4 w-28" />
        </div>
      </div>
    </div>
  );
}
