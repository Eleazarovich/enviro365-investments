import {
  ApiError,
  type CreateWithdrawalRequest,
  type CsvExport,
  type Portfolio,
  type WithdrawalFilters,
  type WithdrawalNotice,
} from '../types';
import { endpoints } from './config';

function buildQuery(filters: WithdrawalFilters): string {
  const params = new URLSearchParams();
  if (filters.productId) params.set('productId', String(filters.productId));
  if (filters.fromDate) params.set('fromDate', filters.fromDate);
  if (filters.toDate) params.set('toDate', filters.toDate);
  const q = params.toString();
  return q ? `?${q}` : '';
}

async function toApiError(res: Response): Promise<ApiError> {
  let message = 'Something went wrong. Please try again.';
  try {
    const body = await res.json();
    if (body?.message) message = body.message;
  } catch {
    // Response had no JSON body
  }
  const code = res.status === 404 ? 'NOT_FOUND' : res.status >= 500 ? 'UNEXPECTED' : 'VALIDATION_ERROR';
  return new ApiError(code, message, res.status);
}

// Real REST implementation for the Spring Boot backend
export const httpApi = {
  async getPortfolio(): Promise<Portfolio> {
    const res = await fetch(endpoints.portfolio());
    if (!res.ok) throw await toApiError(res);
    return res.json();
  },
  async getWithdrawals(filters: WithdrawalFilters = {}): Promise<WithdrawalNotice[]> {
    const res = await fetch(`${endpoints.withdrawalNotices()}${buildQuery(filters)}`);
    if (!res.ok) throw await toApiError(res);
    return res.json();
  },
  async createWithdrawal(request: CreateWithdrawalRequest): Promise<WithdrawalNotice> {
    const res = await fetch(endpoints.withdrawalNotices(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw await toApiError(res);
    return res.json();
  },
  async exportWithdrawals(filters: WithdrawalFilters = {}): Promise<CsvExport> {
    const res = await fetch(`${endpoints.exportNotices()}${buildQuery(filters)}`);
    if (!res.ok) throw await toApiError(res);
    const disposition = res.headers.get('Content-Disposition') ?? '';
    const match = /filename="?([^"]+)"?/.exec(disposition);
    const today = new Date().toISOString().slice(0, 10);
    return {
      filename: match?.[1] ?? `withdrawal-statement-${today}.csv`,
      content: await res.text(),
    };
  },
};