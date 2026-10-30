import { test, expect } from '../support/fixtures';
import { cents, rand, retirement } from '../support/data';
import {
  expectBalance,
  expectHistory,
  openHistory,
  openInvestment,
  openWithdrawal,
} from '../support/ui';

test('mobile portfolio navigation, readable details, and completed withdrawal', async ({
  page,
  backend,
}) => {
  const before = await backend.snapshot();
  const summary = await openInvestment(page, retirement.name);
  await expectBalance(summary, retirement.underlying);
  const dialog = await openWithdrawal(page);
  const amountCents = 12_345;
  const amount = dialog.getByLabel('Amount', { exact: true });
  await amount.fill(String(amountCents / 100));
  await expect(amount).toHaveValue('123.45');
  await dialog.getByRole('button', { name: 'Confirm withdrawal', exact: true }).click();
  const confirmation = page.getByRole('dialog', {
    name: 'Withdrawal submitted successfully',
    exact: true,
  });
  await expect(confirmation).toBeVisible();
  await expect(confirmation).toContainText(rand(-amountCents));
  await confirmation.getByRole('button', { name: 'Done', exact: true }).click();
  await expectBalance(summary, retirement.underlying - amountCents);
  const after = await backend.snapshot();
  expect(after.portfolio.totalAvailable).toBe(
    (cents(before.portfolio.totalAvailable) - amountCents) / 100
  );
  expect(after.portfolio.products.find((product) => product.id === retirement.id)).toMatchObject({
    availableBalance: (retirement.underlying - amountCents) / 100,
    pendingWithdrawals: amountCents / 100,
    maximumWithdrawable: (Math.floor((retirement.underlying * 90) / 100) - amountCents) / 100,
  });
  expect(after.history).toHaveLength(before.history.length + 1);
  expect(after.history[0]).toMatchObject({
    productId: retirement.id,
    amount: amountCents / 100,
    status: 'SUBMITTED',
  });
  await openHistory(page);
  await expectHistory(page, after.history, true);
  await page
    .getByRole('link', { name: 'Portfolio', exact: true })
    .filter({ visible: true })
    .click();
  await expect(page.getByRole('heading', { name: 'Your investments', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
});
