import AppLayout from '@/components/AppLayout';
import PortfolioHero from './components/PortfolioHero';
import InvestmentCardList from './components/InvestmentCardList';
import RecentActivityPanel from './components/RecentActivityPanel';
import LimitsExplainer from './components/LimitsExplainer';

export default function PortfolioDashboardPage() {
  return (
    <AppLayout>
      <div className="space-y-7">
        <PortfolioHero />
        <InvestmentCardList />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            <RecentActivityPanel />
          </div>
          <LimitsExplainer />
        </div>
      </div>
    </AppLayout>
  );
}
