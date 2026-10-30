import type { Portfolio, WithdrawalFilters, WithdrawalNotice } from '../../frontend/src/lib/types';

// Independent expectations for seed.sql. Money arithmetic uses integer cents.
export const cash = { id: 1, name: 'Cash Investment', underlying: 10_000_000, reserved: 2_000_000 };
export const retirement = {
  id: 2,
  name: 'Retirement Investment',
  underlying: 6_000_000,
  reserved: 0,
};
export const cents = (amount: number) => Math.round(amount * 100);
export const rand = (amountInCents: number, alwaysCents = false) => {
  const absolute = Math.abs(amountInCents);
  const whole = Math.floor(absolute / 100).toLocaleString('en-US');
  const fraction = String(absolute % 100).padStart(2, '0');
  return `${amountInCents < 0 ? '-' : ''}R${whole}${alwaysCents || absolute % 100 ? `.${fraction}` : ''}`;
};

export function seededPortfolio(age = 68): Portfolio {
  const products = [cash, retirement].map((product) => ({
    id: product.id,
    name: product.name,
    type: product.id === 1 ? ('GENERAL' as const) : ('RETIREMENT' as const),
    availableBalance: (product.underlying - product.reserved) / 100,
    minimumWithdrawable: 100,
    maximumWithdrawable: (Math.floor((product.underlying * 90) / 100) - product.reserved) / 100,
    pendingWithdrawals: product.reserved / 100,
  }));
  return {
    investor: { id: 1, name: 'E2E Investor', age, investorSince: '2026-04-01' },
    totalAvailable: products.reduce((sum, product) => sum + product.availableBalance, 0),
    products,
  };
}

export const seededHistory: WithdrawalNotice[] = [
  { id: 1001, productId: 1, amount: 20000, submittedAt: '2026-10-21T09:12:00Z' },
  { id: 1002, productId: 1, amount: 4500, submittedAt: '2026-09-30T23:59:59.999999Z' },
  { id: 1003, productId: 2, amount: 7500.5, submittedAt: '2026-09-01T00:00:00Z' },
  { id: 1004, productId: 1, amount: 1850.75, submittedAt: '2026-08-31T23:59:59.999999Z' },
  { id: 1005, productId: 2, amount: 3200, submittedAt: '2026-10-01T00:00:00Z' },
  { id: 1006, productId: 1, amount: 100.25, submittedAt: '2026-09-01T00:00:00Z' },
  { id: 1007, productId: 1, amount: 200.5, submittedAt: '2026-09-15T12:00:00Z' },
  { id: 1008, productId: 2, amount: 850.75, submittedAt: '2026-09-30T23:59:59.999999Z' },
]
  .map((record) => ({
    ...record,
    productName: record.productId === cash.id ? cash.name : retirement.name,
    status: 'SUBMITTED' as const,
  }))
  .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt) || b.id - a.id);

export function filteredHistory(filters: WithdrawalFilters): WithdrawalNotice[] {
  return seededHistory.filter((record) => {
    const date = record.submittedAt.slice(0, 10);
    return (
      (!filters.productId || record.productId === filters.productId) &&
      (!filters.fromDate || date >= filters.fromDate) &&
      (!filters.toDate || date <= filters.toDate)
    );
  });
}
