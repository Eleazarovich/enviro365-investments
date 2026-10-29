import type { InvestmentProduct } from './types';
import { formatRandPrecise } from './format';

export interface ValidationContext {
  product: InvestmentProduct;
  investorAge: number;
}

// Client-side pre-checks for fast feedback.
// The backend remains the final authority for all business validation.
export function validateWithdrawalAmount(raw: string, ctx: ValidationContext): string | true {
  const value = (raw ?? '').trim().replace(/,/g, '');
  if (value === '') return 'Enter an amount to withdraw.';
  if (!/^\d+(\.\d+)?$/.test(value)) return 'Enter a valid amount, for example 1500.00.';
  const amount = Number(value);
  if (!(amount > 0)) return 'Enter an amount greater than R0.';
  if (/\.\d{3,}$/.test(value)) return 'Enter an amount with no more than two decimal places.';
  if (ctx.product.type === 'RETIREMENT' && ctx.investorAge <= 65) {
    return 'Retirement withdrawals are only available to investors older than 65.';
  }
  if (amount > ctx.product.availableBalance) {
    return `Your available balance for this investment is ${formatRandPrecise(ctx.product.availableBalance)}.`;
  }
  if (amount > ctx.product.maximumWithdrawable) {
    return `You can withdraw up to ${formatRandPrecise(ctx.product.maximumWithdrawable)} from this investment.`;
  }
  if (amount < ctx.product.minimumWithdrawable) {
    return `Minimum withdrawal is ${formatRandPrecise(ctx.product.minimumWithdrawable)}.`;
  }
  return true;
}

export function parseAmount(raw: string): number {
  return Number(raw.trim().replace(/,/g, ''));
}
