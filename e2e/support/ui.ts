import { expect, type Locator, type Page } from '@playwright/test';
import type { WithdrawalFilters, WithdrawalNotice } from '../../frontend/src/lib/types';
import { cents, rand } from './data';

export async function openInvestment(page: Page, productName: string) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your investments', exact: true })).toBeVisible();
  await page.getByRole('link', { name: new RegExp(productName) }).click();
  await expect(page.getByRole('heading', { name: productName, exact: true })).toBeVisible();
  return page.getByRole('region', { name: productName, exact: true });
}

export async function expectBalance(summary: Locator, amountInCents: number) {
  await expect(summary.getByText('Available balance', { exact: true })).toBeVisible();
  // BalanceAmount exposes one complete amount to screen readers and a split visual amount.
  await expect(summary).toContainText(rand(amountInCents, true));
}

export async function openWithdrawal(page: Page) {
  await page.getByRole('button', { name: 'Withdraw money', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Withdraw money', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('Amount', { exact: true })).toBeEditable();
  return dialog;
}

export async function openHistory(page: Page) {
  await page
    .getByRole('link', { name: 'Withdrawals', exact: true })
    .filter({ visible: true })
    .click();
  await expect(page).toHaveURL(/\/withdrawal-history$/);
  await expect(page.getByRole('button', { name: 'Download statement', exact: true })).toBeEnabled();
}

export async function applyFilters(page: Page, filters: WithdrawalFilters) {
  await page
    .getByLabel('Investment', { exact: true })
    .selectOption(filters.productId ? String(filters.productId) : '');
  await page.getByLabel('Start date', { exact: true }).fill(filters.fromDate ?? '');
  await page.getByLabel('End date', { exact: true }).fill(filters.toDate ?? '');
  await expect(page.getByRole('button', { name: 'Download statement', exact: true })).toBeEnabled();
  await expect(
    page.getByRole('region', { name: 'Withdrawal history', exact: true })
  ).toHaveAttribute('aria-busy', 'false');
}

export async function expectHistory(page: Page, records: WithdrawalNotice[], mobile = false) {
  const history = page.getByRole('region', { name: 'Withdrawal history', exact: true });
  const container = mobile
    ? history.getByRole('list', { name: 'Your withdrawals, newest first', exact: true })
    : history.getByRole('table', { name: 'Your withdrawals, newest first', exact: true });
  const rows = mobile
    ? container.getByRole('listitem')
    : container.getByRole('row').filter({ has: page.getByRole('cell') });
  await expect(container).toBeVisible();
  await expect(rows).toHaveCount(records.length);
  for (const [index, record] of records.entries()) {
    await expect(rows.nth(index)).toContainText(record.productName);
    await expect(rows.nth(index)).toContainText(rand(-cents(record.amount)));
    await expect(rows.nth(index).locator('time')).toHaveAttribute('datetime', record.submittedAt);
  }
}
