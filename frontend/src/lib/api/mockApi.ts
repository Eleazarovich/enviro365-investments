import {
  ApiError,
  type CreateWithdrawalRequest,
  type CsvExport,
  type Portfolio,
  type WithdrawalFilters,
  type WithdrawalNotice,
} from '../types';
import { computeProduct, mockInvestor, mockProductRecords, mockState, round2 } from './mockStore';
import { formatRandPrecise } from '../format';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Test hooks so error states can be demonstrated without a backend
export const mockControls = {
  failNextPortfolio: false,
  failNextHistory: false,
  failNextSubmit: false,
  failNextExport: false,
};

function toPublic(n: (typeof mockState.notices)[number]): WithdrawalNotice {
  return {
    id: n.id,
    productId: n.productId,
    productName: n.productName,
    amount: n.amount,
    status: n.status,
    submittedAt: n.submittedAt,
  };
}

function applyFilters(filters: WithdrawalFilters): WithdrawalNotice[] {
  return mockState.notices
    .filter((n) => (filters.productId ? n.productId === filters.productId : true))
    .filter((n) => {
      const day = n.submittedAt.slice(0, 10);
      if (filters.fromDate && day < filters.fromDate) return false;
      if (filters.toDate && day > filters.toDate) return false;
      return true;
    })
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))
    .map(toPublic);
}

export const mockApi = {
  // GET /api/investors/1/portfolio
  async getPortfolio(): Promise<Portfolio> {
    await delay(650);
    if (mockControls.failNextPortfolio) {
      mockControls.failNextPortfolio = false;
      throw new ApiError('UNEXPECTED', "We couldn't load your portfolio. Please try again.", 500);
    }
    const products = mockProductRecords.map(computeProduct);
    return {
      investor: { ...mockInvestor },
      totalAvailable: round2(products.reduce((s, p) => s + p.availableBalance, 0)),
      products,
    };
  },

  // GET /api/investors/1/withdrawal-notices
  async getWithdrawals(filters: WithdrawalFilters = {}): Promise<WithdrawalNotice[]> {
    await delay(550);
    if (mockControls.failNextHistory) {
      mockControls.failNextHistory = false;
      throw new ApiError(
        'UNEXPECTED',
        "We couldn't load your withdrawal history. Please try again.",
        500
      );
    }
    return applyFilters(filters);
  },

  // POST /api/investors/1/withdrawal-notices
  async createWithdrawal(request: CreateWithdrawalRequest): Promise<WithdrawalNotice> {
    await delay(1100);
    if (mockControls.failNextSubmit) {
      mockControls.failNextSubmit = false;
      throw new ApiError(
        'UNEXPECTED',
        "We couldn't submit your withdrawal. Please try again.",
        500
      );
    }
    const record = mockProductRecords.find((p) => p.id === request.productId);
    if (!record) {
      throw new ApiError('NOT_FOUND', "We couldn't find that investment.", 404);
    }
    const amount = request.amount;
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ApiError('VALIDATION_ERROR', 'Enter an amount greater than R0.', 400);
    }
    if (
      Math.round(amount * 100) !== amount * 100 &&
      Math.abs(Math.round(amount * 100) - amount * 100) > 1e-6
    ) {
      throw new ApiError(
        'VALIDATION_ERROR',
        'Enter an amount with no more than two decimal places.',
        400
      );
    }
    if (record.type === 'RETIREMENT' && mockInvestor.age <= 65) {
      throw new ApiError(
        'NOT_ELIGIBLE',
        'Retirement withdrawals are only available to investors older than 65.',
        422
      );
    }
    const product = computeProduct(record);
    if (amount > product.availableBalance) {
      throw new ApiError(
        'INSUFFICIENT_BALANCE',
        `Your available balance for this investment is ${formatRandPrecise(product.availableBalance)}.`,
        422
      );
    }
    if (amount > product.maximumWithdrawable) {
      throw new ApiError(
        'LIMIT_EXCEEDED',
        `You can withdraw up to ${formatRandPrecise(product.maximumWithdrawable)} from this investment.`,
        422
      );
    }
    const notice = {
      id: mockState.nextId++,
      productId: record.id,
      productName: record.name,
      amount: round2(amount),
      status: 'SUBMITTED' as const,
      submittedAt: new Date().toISOString(),
      pending: true,
    };
    mockState.notices.push(notice);
    return toPublic(notice);
  },

  // GET /api/investors/1/withdrawal-notices/export
  async exportWithdrawals(filters: WithdrawalFilters = {}): Promise<CsvExport> {
    await delay(700);
    if (mockControls.failNextExport) {
      mockControls.failNextExport = false;
      throw new ApiError(
        'UNEXPECTED',
        "We couldn't prepare your statement. Please try again.",
        500
      );
    }
    const rows = applyFilters(filters);
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const header = 'Date,Investment,Amount';
    const lines = rows.map((r) =>
      [r.submittedAt.slice(0, 10), escape(r.productName), (-r.amount).toFixed(2)].join(',')
    );
    const today = new Date().toISOString().slice(0, 10);
    return {
      filename: `withdrawal-statement-${today}.csv`,
      content: [header, ...lines].join('\r\n'),
    };
  },
};
