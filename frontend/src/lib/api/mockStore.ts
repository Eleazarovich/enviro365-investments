import type { InvestmentProduct, Investor, WithdrawalNotice } from '../types';

interface MockProductRecord {
  id: number;
  name: string;
  type: 'GENERAL' | 'RETIREMENT';
  recordedBalance: number;
}

// Demonstration data only. Not information about a real investor.
export const mockInvestor: Investor = {
  id: 1,
  name: 'Eleazarovich',
  age: 68,
  investorSince: '2026-10-01',
};

export const mockProductRecords: MockProductRecord[] = [
  { id: 1, name: 'Cash Investment', type: 'GENERAL', recordedBalance: 100000 },
  { id: 2, name: 'Retirement Investment', type: 'RETIREMENT', recordedBalance: 60000 },
];

// Seed history. R20,000 on Cash is the existing submitted withdrawal.
// The remaining historical rows are settled entries kept as SUBMITTED records
// that are excluded from the pending total (see isPending flag below).
interface SeedNotice extends WithdrawalNotice {
  pending: boolean;
}

const seed: SeedNotice[] = [
  {
    id: 1001,
    productId: 1,
    productName: 'Cash Investment',
    amount: 20000,
    status: 'SUBMITTED',
    submittedAt: '2026-10-21T09:12:00Z',
    pending: true,
  },
  {
    id: 1000,
    productId: 1,
    productName: 'Cash Investment',
    amount: 4500,
    status: 'SUBMITTED',
    submittedAt: '2026-09-30T13:40:00Z',
    pending: false,
  },
  {
    id: 999,
    productId: 2,
    productName: 'Retirement Investment',
    amount: 7500.5,
    status: 'SUBMITTED',
    submittedAt: '2026-09-12T08:05:00Z',
    pending: false,
  },
  {
    id: 998,
    productId: 1,
    productName: 'Cash Investment',
    amount: 12000,
    status: 'SUBMITTED',
    submittedAt: '2026-08-26T15:22:00Z',
    pending: false,
  },
  {
    id: 997,
    productId: 2,
    productName: 'Retirement Investment',
    amount: 3200,
    status: 'SUBMITTED',
    submittedAt: '2026-08-04T10:18:00Z',
    pending: false,
  },
  {
    id: 996,
    productId: 1,
    productName: 'Cash Investment',
    amount: 1850.75,
    status: 'SUBMITTED',
    submittedAt: '2026-07-17T07:55:00Z',
    pending: false,
  },
  {
    id: 995,
    productId: 2,
    productName: 'Retirement Investment',
    amount: 9000,
    status: 'SUBMITTED',
    submittedAt: '2026-06-23T12:30:00Z',
    pending: false,
  },
  {
    id: 994,
    productId: 1,
    productName: 'Cash Investment',
    amount: 6000,
    status: 'SUBMITTED',
    submittedAt: '2026-05-14T14:02:00Z',
    pending: false,
  },
  {
    id: 993,
    productId: 1,
    productName: 'Cash Investment',
    amount: 2750,
    status: 'SUBMITTED',
    submittedAt: '2026-04-02T09:47:00Z',
    pending: false,
  },
];

// In-memory state, replaced by the Spring Boot backend later.
export const mockState = {
  notices: seed.map((n) => ({ ...n })) as SeedNotice[],
  nextId: 1002,
};

const MINIMUM_WITHDRAWAL_CENTS = 10000;

export function computeProduct(record: MockProductRecord): InvestmentProduct {
  // Sum cents rather than floating-point rands so repeated requests preserve the balance.
  const pendingCents = mockState.notices
    .filter((n) => n.productId === record.id && n.pending)
    .reduce((sum, n) => sum + Math.round(n.amount * 100), 0);
  const availableCents = Math.max(0, Math.round(record.recordedBalance * 100) - pendingCents);
  // Each request allows 90% of the remaining balance, rounded down to a whole cent.
  const maximumCents = Math.floor((availableCents * 9) / 10);
  return {
    id: record.id,
    name: record.name,
    type: record.type,
    availableBalance: availableCents / 100,
    minimumWithdrawable: MINIMUM_WITHDRAWAL_CENTS / 100,
    // No amount is eligible when the percentage limit is below the R100 minimum.
    maximumWithdrawable: maximumCents >= MINIMUM_WITHDRAWAL_CENTS ? maximumCents / 100 : 0,
    pendingWithdrawals: pendingCents / 100,
  };
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
