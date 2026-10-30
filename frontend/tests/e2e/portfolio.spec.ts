import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Portfolio, WithdrawalNotice } from '../../src/lib/types';
import { formatRandPrecise } from '../../src/lib/format';

const backend = 'http://127.0.0.1:8081/api/investors/1';

test('portfolio loads real balances and opens investment details', async ({ page, request }) => {
  const portfolio: Portfolio = await (await request.get(`${backend}/portfolio`)).json();
  await page.goto('/');
  const summary = page.getByRole('region', { name: 'Portfolio value', exact: true });
  await expect(summary).toContainText(formatRandPrecise(portfolio.totalAvailable));
  for (const product of portfolio.products) {
    const card = page.getByRole('link', { name: new RegExp(product.name) });
    await expect(card).toContainText(formatRandPrecise(product.availableBalance));
  }
  await page.locator('a[href="/investment-detail?id=1"]').click();
  await expect(page.getByRole('heading', { name: 'Cash Investment', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Back to portfolio', exact: true }).click();
  await expect(page).toHaveURL('/');
});

test('valid withdrawal updates the balance and appears in history after refresh', async ({
  page,
  request,
}) => {
  const before: Portfolio = await (await request.get(`${backend}/portfolio`)).json();
  const cash = before.products.find((p) => p.id === 1)!;
  const history: WithdrawalNotice[] = await (
    await request.get(`${backend}/withdrawal-notices`)
  ).json();
  await page.goto('/investment-detail?id=1');
  await page.getByRole('button', { name: 'Withdraw money', exact: true }).click();
  await page.getByRole('textbox', { name: 'Amount', exact: true }).fill('1500.75');
  await page.getByRole('button', { name: 'Confirm withdrawal', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Withdrawal submitted successfully', exact: true })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('region', { name: 'Cash Investment', exact: true })).toContainText(
    formatRandPrecise(cash.availableBalance - 1500.75)
  );
  const after: Portfolio = await (await request.get(`${backend}/portfolio`)).json();
  expect(after.totalAvailable).toBe(before.totalAvailable - 1500.75);
  const notices: WithdrawalNotice[] = await (
    await request.get(`${backend}/withdrawal-notices`)
  ).json();
  expect(notices).toHaveLength(history.length + 1);
  expect(notices[0]).toMatchObject({ productId: 1, amount: 1500.75 });
  await page.goto('/withdrawal-history');
  await expect(
    page.locator('main').getByText('-R1,500.75', { exact: true }).filter({ visible: true })
  ).toBeVisible();
});

test('invalid amounts show feedback and leave backend data unchanged', async ({
  page,
  request,
}) => {
  const before = await (await request.get(`${backend}/portfolio`)).json();
  const history = await (await request.get(`${backend}/withdrawal-notices`)).json();
  await page.goto('/investment-detail?id=1');
  await page.getByRole('button', { name: 'Withdraw money', exact: true }).click();
  const amount = page.getByRole('textbox', { name: 'Amount', exact: true });
  const confirm = page.getByRole('button', { name: 'Confirm withdrawal', exact: true });
  await amount.fill('99.99');
  await confirm.click();
  await expect(page.getByRole('dialog').getByRole('alert')).toHaveText(
    'Minimum withdrawal is R100.'
  );
  await amount.fill('999999');
  await confirm.click();
  await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible();
  expect(await (await request.get(`${backend}/portfolio`)).json()).toEqual(before);
  expect(await (await request.get(`${backend}/withdrawal-notices`)).json()).toEqual(history);
});

test('history filters and CSV contain the same selected record', async ({ page }) => {
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
  expect(await readFile((await download.path())!, 'utf8')).toBe(
    '\uFEFFDate,Investment,Amount\r\n2026-09-30,"Cash Investment",-4500.00'
  );
});

test('a stale balance displays the real backend rejection', async ({ page, request }) => {
  const before: Portfolio = await (await request.get(`${backend}/portfolio`)).json();
  const retirement = before.products.find((p) => p.id === 2)!;
  await page.goto('/investment-detail?id=2');
  await page.getByRole('button', { name: 'Withdraw money', exact: true }).click();
  await page.getByRole('textbox', { name: 'Amount', exact: true }).fill('100');
  // A second client reserves the limit after this page has loaded.
  const competing = await request.post(`${backend}/withdrawal-notices`, {
    data: { productId: 2, amount: retirement.maximumWithdrawable },
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
});
