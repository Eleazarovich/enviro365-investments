import AppLayout from '@/components/AppLayout';
import PortfolioHero from './components/PortfolioHero';
import InvestmentCardList from './components/InvestmentCardList';
import RecentActivityPanel from './components/RecentActivityPanel';
import LimitsExplainer from './components/LimitsExplainer';

export default function PortfolioDashboardPage() {
  return (
    <AppLayout>
      <div className="space-y-8">
        <PortfolioHero />
        <InvestmentCardList />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RecentActivityPanel />
          </div>
          <LimitsExplainer />
        </div>
      </div>
    </AppLayout>
  );
}