import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Portfolio, WithdrawalNotice } from '../../src/lib/types';
import { formatRandPrecise } from '../../src/lib/format';

const backend = 'http://127.0.0.1:8081/api/investors/1';

test('live Java/H2 withdrawal, refresh, validation, history filters and CSV download', async ({
  page,
  request,
}) => {
  const browserErrors: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  const before: Portfolio = await (await request.get(`${backend}/portfolio`)).json();
  const cash = before.products.find((p) => p.id === 1)!;
  const beforeHistory: WithdrawalNotice[] = await (
    await request.get(`${backend}/withdrawal-notices`)
  ).json();

  await page.goto('/');
  await expect(
    page.getByText(formatRandPrecise(cash.maximumWithdrawable), { exact: true }).first()
  ).toBeVisible();
  await page.locator('a[href="/investment-detail?id=1"]').click();
  await page.getByRole('button', { name: 'Withdraw money', exact: true }).click();
  const amount = page.getByRole('textbox', { name: 'Amount', exact: true });
  await amount.fill('99.99');
  await page.getByRole('button', { name: 'Confirm withdrawal', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toHaveText(
    'Minimum withdrawal is R100.'
  );
  await amount.fill('1500.75');
  const submitted = page.waitForResponse(
    (r) => r.url() === `${backend}/withdrawal-notices` && r.request().method() === 'POST'
  );
  await page.getByRole('button', { name: 'Confirm withdrawal', exact: true }).click();
  expect((await submitted).status()).toBe(201);
  await expect(
    page.getByRole('heading', { name: 'Withdrawal submitted successfully', exact: true })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  const summary = page.getByRole('region', { name: 'Cash Investment', exact: true });
  await expect(
    summary.getByText(formatRandPrecise(cash.maximumWithdrawable - 1500.75), { exact: true })
  ).toBeVisible();

  const after: Portfolio = await (await request.get(`${backend}/portfolio`)).json();
  expect(after.totalAvailable).toBe(before.totalAvailable - 1500.75);
  expect(after.products[0].availableBalance).toBe(cash.availableBalance - 1500.75);
  expect(after.products[0].pendingWithdrawals).toBe(cash.pendingWithdrawals + 1500.75);
  const history: WithdrawalNotice[] = await (
    await request.get(`${backend}/withdrawal-notices`)
  ).json();
  expect(history).toHaveLength(beforeHistory.length + 1);
  expect(history[0]).toMatchObject({ productId: 1, amount: 1500.75, status: 'SUBMITTED' });
  await page.reload();
  await expect(
    summary.getByText(formatRandPrecise(cash.maximumWithdrawable - 1500.75), { exact: true })
  ).toBeVisible();

  // Invalid API requests must leave the persisted portfolio and notice count unchanged.
  const rejected = await request.post(`${backend}/withdrawal-notices`, {
    data: { productId: 1, amount: after.products[0].maximumWithdrawable + 0.01 },
  });
  expect(rejected.status()).toBe(422);
  expect((await rejected.json()).message).toContain('You can withdraw up to');
  expect(await (await request.get(`${backend}/portfolio`)).json()).toEqual(after);
  expect(await (await request.get(`${backend}/withdrawal-notices`)).json()).toHaveLength(
    history.length
  );

  await page.goto('/withdrawal-history');
  await page.getByLabel('Investment', { exact: true }).selectOption('1');
  await page.getByLabel('Start date', { exact: true }).fill('2026-09-30');
  await page.getByLabel('End date', { exact: true }).fill('2026-09-30');
  const downloadButton = page.getByRole('button', { name: 'Download statement', exact: true });
  await expect(downloadButton).toBeEnabled();
  await expect(
    page.locator('main').getByText('-R4,500', { exact: true }).filter({ visible: true })
  ).toBeVisible();
  const downloaded = page.waitForEvent('download');
  await downloadButton.click();
  const download = await downloaded;
  expect(download.suggestedFilename()).toMatch(/^withdrawal-statement-\d{4}-\d{2}-\d{2}\.csv$/);
  const content = await readFile((await download.path())!, 'utf8');
  expect(content).toBe('\uFEFFDate,Investment,Amount\r\n2026-09-30,"Cash Investment",-4500.00');
  expect(browserErrors).toEqual([]);
});

test('live backend business error is displayed when a balance becomes stale', async ({
  page,
  request,
}) => {
  const before: Portfolio = await (await request.get(`${backend}/portfolio`)).json();
  const product = before.products.find((p) => p.id === 2)!;
  if (product.maximumWithdrawable < 100) {
    // The desktop project exhausts retirement's cap; mobile proves the disabled state persists.
    await page.goto('/investment-detail?id=2');
    await expect(page.getByRole('button', { name: 'Withdraw money', exact: true })).toBeDisabled();
    return;
  }
  await page.goto('/investment-detail?id=2');
  await page.getByRole('button', { name: 'Withdraw money', exact: true }).click();
  await page.getByRole('textbox', { name: 'Amount', exact: true }).fill('100');
  // Another client reserves funds after this page has read its limit.
  const competing = await request.post(`${backend}/withdrawal-notices`, {
    data: { productId: 2, amount: product.maximumWithdrawable },
  });
  expect(competing.status()).toBe(201);
  const rejected = page.waitForResponse(
    (r) => r.url() === `${backend}/withdrawal-notices` && r.request().method() === 'POST'
  );
  await page.getByRole('button', { name: 'Confirm withdrawal', exact: true }).click();
  expect((await rejected).status()).toBe(422);
  await expect(page.getByRole('dialog').getByRole('alert')).toHaveText(
    'You can withdraw up to R0.00 from this investment.'
  );
  const after: Portfolio = await (await request.get(`${backend}/portfolio`)).json();
  expect(after.products[1].availableBalance).toBe(
    product.availableBalance - product.maximumWithdrawable
  );
  expect(after.products[1].maximumWithdrawable).toBe(0);
});
