export type ProductType = 'GENERAL' | 'RETIREMENT';
export type WithdrawalStatus = 'SUBMITTED';

export interface Investor {
  id: number;
  name: string;
  age: number;
  investorSince?: string; // ISO date (yyyy-mm-dd)
}

export interface InvestmentProduct {
  id: number;
  name: string;
  type: ProductType;
  availableBalance: number;
  minimumWithdrawable: number;
  maximumWithdrawable: number;
  // Amount already committed to submitted withdrawals (display only)
  pendingWithdrawals: number;
}

export interface Portfolio {
  investor: Investor;
  totalAvailable: number;
  products: InvestmentProduct[];
}

export interface WithdrawalNotice {
  id: number;
  productId: number;
  productName: string;
  amount: number;
  status: WithdrawalStatus;
  submittedAt: string; // ISO timestamp
}

export interface WithdrawalFilters {
  productId?: number;
  fromDate?: string; // yyyy-mm-dd
  toDate?: string; // yyyy-mm-dd
}

export interface CreateWithdrawalRequest {
  productId: number;
  amount: number;
}

export interface CsvExport {
  filename: string;
  content: string;
}

export type ApiErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'UNEXPECTED';

export class ApiError extends Error {
  code: ApiErrorCode;
  status: number;
  constructor(code: ApiErrorCode, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'ApiError';
  }
}
