import { test as base, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import type { Portfolio, WithdrawalNotice } from '../../src/lib/types';

interface ApiFixture {
  portfolio: Portfolio;
  notices: WithdrawalNotice[];
  failPortfolio: boolean;
  failHistory: boolean;
  failSubmit: boolean;
  failExport: boolean;
  submitCount: number;
}

const test = base.extend<{ api: ApiFixture }>({
  api: async ({ page }, use) => {
    const state: ApiFixture = {
      portfolio: {
        investor: { id: 1, name: 'Thandiwe Mokoena', age: 68 },
        totalAvailable: 140000,
        products: [
          {
            id: 1,
            name: 'Cash Investment',
            type: 'GENERAL',
            availableBalance: 80000,
            maximumWithdrawable: 70000,
            pendingWithdrawals: 20000,
          },
          {
            id: 2,
            name: 'Retirement Investment',
            type: 'RETIREMENT',
            availableBalance: 60000,
            maximumWithdrawable: 54000,
            pendingWithdrawals: 0,
          },
        ],
      },
      notices: [
        {
          id: 1001,
          productId: 1,
          productName: 'Cash Investment',
          amount: 20000,
          status: 'SUBMITTED',
          submittedAt: '2026-10-21T09:12:00Z',
        },
        {
          id: 1000,
          productId: 1,
          productName: 'Cash Investment',
          amount: 4500,
          status: 'SUBMITTED',
          submittedAt: '2026-09-30T13:40:00Z',
        },
        {
          id: 999,
          productId: 2,
          productName: 'Retirement Investment',
          amount: 7500.5,
          status: 'SUBMITTED',
          submittedAt: '2026-09-12T08:05:00Z',
        },
      ],
      failPortfolio: false,
      failHistory: false,
      failSubmit: false,
      failExport: false,
      submitCount: 0,
    };
    await page.route(/static\.rocket\.new/, (route) => route.abort());
    await page.route('**/api/investors/1/**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const fail = () =>
        route.fulfill({
          status: 500,
          json: { message: 'Please try again. Your request could not be completed.' },
        });
      if (url.pathname.endsWith('/portfolio')) {
        if (state.failPortfolio) {
          state.failPortfolio = false;
          await fail();
          return;
        }
        await route.fulfill({ json: state.portfolio });
        return;
      }
      if (request.method() === 'POST') {
        state.submitCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 350));
        if (state.failSubmit) {
          state.failSubmit = false;
          await fail();
          return;
        }
        const { productId, amount } = request.postDataJSON();
        const product = state.portfolio.products.find((p) => p.id === productId)!;
        const notice: WithdrawalNotice = {
          id: 1002,
          productId,
          productName: product.name,
          amount,
          status: 'SUBMITTED',
          submittedAt: '2026-10-28T12:00:00Z',
        };
        product.availableBalance -= amount;
        product.maximumWithdrawable -= amount;
        product.pendingWithdrawals += amount;
        state.portfolio.totalAvailable -= amount;
        state.notices.unshift(notice);
        await route.fulfill({ status: 201, json: notice });
        return;
      }
      const rows = state.notices.filter(
        (row) =>
          (!url.searchParams.get('productId') ||
            row.productId === Number(url.searchParams.get('productId'))) &&
          (!url.searchParams.get('fromDate') ||
            row.submittedAt.slice(0, 10) >= url.searchParams.get('fromDate')!) &&
          (!url.searchParams.get('toDate') ||
            row.submittedAt.slice(0, 10) <= url.searchParams.get('toDate')!)
      );
      if (url.pathname.endsWith('/export')) {
        if (state.failExport) {
          state.failExport = false;
          await fail();
          return;
        }
        await route.fulfill({
          contentType: 'text/csv',
          headers: { 'Content-Disposition': 'attachment; filename="withdrawal-statement.csv"' },
          body: [
            'Date,Investment,Amount,Status',
            ...rows.map(
              (row) =>
                `${row.submittedAt.slice(0, 10)},${row.productName},${row.amount.toFixed(2)},Submitted`
            ),
          ].join('\r\n'),
        });
        return;
      }
      if (state.failHistory) {
        state.failHistory = false;
        await fail();
        return;
      }
      await route.fulfill({ json: rows });
    });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await use(state);
    expect(errors, 'No uncaught browser errors').toEqual([]);
  },
});

async function openWithdrawal(page: Page, productId = 1) {
  await page.goto(`/investment-detail?id=${productId}`);
  await page.getByRole('button', { name: 'Withdraw money', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  return page.getByRole('textbox', { name: 'Amount', exact: true });
}

async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
}

test('portfolio preserves balances and investment navigation', async ({ page, api }) => {
  void api;
  await page.goto('/');
  await expect(page.getByText('R140,000.00', { exact: true }).first()).toBeAttached();
  await page.locator('a[href="/investment-detail?id=1"]').click();
  await expect(page.getByRole('heading', { name: 'Cash Investment', exact: true })).toBeVisible();
  await expect(page.getByText('R70,000', { exact: true }).first()).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '22');
  await expectNoOverflow(page);
});

test('invalid amounts preserve the existing financial boundaries', async ({ page, api }) => {
  const input = await openWithdrawal(page);
  const submit = page.getByRole('button', { name: 'Submit withdrawal', exact: true });
  for (const [amount, message] of [
    ['', 'Enter an amount to withdraw.'],
    ['0', 'Enter an amount greater than R0.'],
    ['abc', 'Enter a valid amount, for example 1500.00.'],
    ['1.001', 'Enter an amount with no more than two decimal places.'],
    ['80001', 'Your available balance for this investment is R80,000.'],
    ['70000.01', 'You can withdraw up to R70,000 from this investment.'],
  ]) {
    await input.fill(amount);
    await submit.click();
    await expect(page.getByRole('dialog').getByRole('alert')).toHaveText(message);
    await expect(input).toHaveAttribute('aria-invalid', 'true');
  }
  expect(api.submitCount).toBe(0);
});

test('withdrawal submission updates balances and history once', async ({ page, api }) => {
  const input = await openWithdrawal(page);
  await input.fill('1,500.75');
  await page.getByRole('button', { name: 'Submit withdrawal', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Submitting…', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Cancel', exact: true })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Withdrawal submitted', exact: true })
  ).toBeVisible();
  await expect(page.getByRole('dialog').getByText('R1,500.75', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByText('R78,499.25', { exact: true }).first()).toBeAttached();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '24');
  await expect(
    page.locator('main').getByText('R1,500.75', { exact: true }).filter({ visible: true })
  ).toBeVisible();
  expect(api.submitCount).toBe(1);
  await page.getByRole('link', { name: 'Back to portfolio', exact: true }).click();
  await expect(page.getByText('R138,499.25', { exact: true }).first()).toBeAttached();
});

test('server failure keeps the entered amount for retry', async ({ page, api }) => {
  api.failSubmit = true;
  const input = await openWithdrawal(page);
  await input.fill('1000');
  await page.getByRole('button', { name: 'Submit withdrawal', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
    'Your amount has been kept.'
  );
  await expect(input).toHaveValue('1000');
  await page.getByRole('button', { name: 'Submit withdrawal', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Withdrawal submitted', exact: true })
  ).toBeVisible();
  expect(api.submitCount).toBe(2);
});

test('retirement age restriction and exhausted limits still apply', async ({ page, api }) => {
  api.portfolio.investor.age = 65;
  const input = await openWithdrawal(page, 2);
  await input.fill('100');
  await page.getByRole('button', { name: 'Submit withdrawal', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toHaveText(
    'Retirement withdrawals are only available to investors older than 65.'
  );
  expect(api.submitCount).toBe(0);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  api.portfolio.products[1].maximumWithdrawable = 0;
  await page.reload();
  await expect(page.getByRole('button', { name: 'Withdraw money', exact: true })).toBeDisabled();
});

test('dialog traps keyboard focus, cancels and restores the trigger', async ({ page, api }) => {
  void api;
  const input = await openWithdrawal(page);
  await expect(input).toBeFocused();
  const close = page.getByRole('button', { name: 'Close', exact: true });
  const submit = page.getByRole('button', { name: 'Submit withdrawal', exact: true });
  await close.focus();
  await page.keyboard.press('Shift+Tab');
  await expect(submit).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Withdraw money', exact: true })).toBeFocused();
  await expectNoOverflow(page);
});

test('history filters, invalid dates, empty results and reset work', async ({ page, api }) => {
  void api;
  await page.goto('/withdrawal-history');
  const results = page.getByRole('region', { name: 'All withdrawals', exact: true });
  await expect(results).toContainText('3 withdrawals');
  await page.getByLabel('Investment', { exact: true }).selectOption('2');
  await expect(
    page.getByRole('region', { name: 'Filtered withdrawals', exact: true })
  ).toContainText('1 withdrawal');
  await page.getByLabel('Start date', { exact: true }).fill('2026-10-01');
  await expect(
    page.getByRole('heading', { name: 'No withdrawals match these filters' })
  ).toBeVisible();
  await page.getByLabel('End date', { exact: true }).fill('2026-09-01');
  await expect(page.locator('#date-range-error')).toContainText(
    'The start date is after the end date.'
  );
  await expect(
    page.getByRole('button', { name: 'Download statement', exact: true })
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click();
  await expect(page.getByRole('region', { name: 'All withdrawals', exact: true })).toContainText(
    '3 withdrawals'
  );
  await expectNoOverflow(page);
});

test('CSV download respects investment filters and handles export errors', async ({
  page,
  api,
}) => {
  await page.goto('/withdrawal-history');
  await page.getByLabel('Investment', { exact: true }).selectOption('2');
  const downloadButton = page.getByRole('button', { name: 'Download statement', exact: true });
  await expect(downloadButton).toBeEnabled();
  api.failExport = true;
  await downloadButton.click();
  await expect(page.getByRole('alert').filter({ hasText: 'Please try again.' })).toBeVisible();
  const downloadEvent = page.waitForEvent('download');
  await downloadButton.click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('withdrawal-statement.csv');
  const content = await readFile((await download.path())!, 'utf8');
  expect(content).toContain('Retirement Investment,7500.50,Submitted');
  expect(content).not.toContain('Cash Investment');
});

test('portfolio and history errors recover with retry', async ({ page, api }) => {
  api.failPortfolio = true;
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: "We couldn't load your investments", exact: true })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cash Investment', exact: true })).toBeVisible();
  api.failHistory = true;
  await page.goto('/withdrawal-history');
  await expect(
    page.getByRole('heading', { name: "We couldn't load your withdrawal history", exact: true })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('region', { name: 'All withdrawals', exact: true })).toContainText(
    '3 withdrawals'
  );
});

for (const width of [320, 768, 1024, 1280]) {
  test(`existing screens fit a ${width}px viewport`, async ({ page, api }) => {
    void api;
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/investment-detail?id=1', '/withdrawal-history']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(
        page.getByText('R20,000', { exact: true }).filter({ visible: true }).first()
      ).toBeVisible();
      await expectNoOverflow(page);
    }
  });
}
