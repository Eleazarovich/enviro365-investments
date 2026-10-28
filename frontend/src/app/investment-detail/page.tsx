import { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import InvestmentDetailView from './components/InvestmentDetailView';
import InvestmentDetailSkeleton from './components/InvestmentDetailSkeleton';

export default function InvestmentDetailPage() {
  return (
    <AppLayout>
      <Suspense fallback={<InvestmentDetailSkeleton />}>
        <InvestmentDetailView />
      </Suspense>
    </AppLayout>
  );
}
