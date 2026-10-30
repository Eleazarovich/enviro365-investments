import type { Portfolio, WithdrawalNotice } from '../../frontend/src/lib/types';
import { test, expect } from '../support/fixtures';
import { cash, cents, rand } from '../support/data';
import {
  expectBalance,
  expectHistory,
  openHistory,
  openInvestment,
  openWithdrawal,
} from '../support/ui';

test('fractional withdrawal updates backend balance and history and survives refresh', async ({
  page,
  backend,
}) => {
  const initial = await backend.snapshot();
  const initialCash = initial.portfolio.products.find((product) => product.id === cash.id)!;
  const initialCents = cents(initialCash.availableBalance);
  expect(initialCents).toBe(cash.underlying - cash.reserved);
  const withdrawalCents = 150_075;
  const expectedCents = initialCents - withdrawalCents;

  const summary = await openInvestment(page, cash.name);
  await expectBalance(summary, initialCents);
  const dialog = await openWithdrawal(page);
  await expect(dialog).toContainText(`From ${cash.name}`);
  await dialog.getByLabel('Amount', { exact: true }).fill(String(withdrawalCents / 100));
  const submitted = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/investors/1/withdrawal-notices' &&
      response.request().method() === 'POST'
  );
  await dialog.getByRole('button', { name: 'Confirm withdrawal', exact: true }).click();
  const response = await submitted;
  expect(response.status()).toBe(201);
  expect(response.request().postDataJSON()).toEqual({
    productId: cash.id,
    amount: withdrawalCents / 100,
  });
  const notice: WithdrawalNotice = await response.json();
  expect(notice).toMatchObject({
    productId: cash.id,
    productName: cash.name,
    amount: withdrawalCents / 100,
    status: 'SUBMITTED',
  });
  const confirmation = page.getByRole('dialog', {
    name: 'Withdrawal submitted successfully',
    exact: true,
  });
  await expect(confirmation).toBeVisible();
  await expect(confirmation).toContainText(cash.name);
  await expect(confirmation).toContainText(rand(-withdrawalCents));
  await confirmation.getByRole('button', { name: 'Done', exact: true }).click();
  await expectBalance(summary, expectedCents);

  // Financial expectations come from the known underlying balance and reservations.
  const after = await backend.snapshot();
  const expectedPortfolio: Portfolio = {
    ...initial.portfolio,
    totalAvailable: (cents(initial.portfolio.totalAvailable) - withdrawalCents) / 100,
    products: initial.portfolio.products.map((product) =>
      product.id !== cash.id
        ? product
        : {
            ...product,
            availableBalance: expectedCents / 100,
            maximumWithdrawable:
              (Math.floor((cash.underlying * 90) / 100) - cash.reserved - withdrawalCents) / 100,
            pendingWithdrawals: (cash.reserved + withdrawalCents) / 100,
          }
    ),
  };
  expect(after.portfolio).toEqual(expectedPortfolio);
  expect(after.history).toEqual([notice, ...initial.history]);
  await openHistory(page);
  await expectHistory(page, after.history);
  await page.reload();
  await expectHistory(page, after.history);
  await page
    .getByRole('link', { name: 'Portfolio', exact: true })
    .filter({ visible: true })
    .click();
  await page.getByRole('link', { name: /Cash Investment/ }).click();
  await expectBalance(summary, expectedCents);
  await page.reload();
  await expectBalance(summary, expectedCents);
  expect(await backend.snapshot()).toEqual(after);
});

const invalidAmounts = [
  { title: 'zero', raw: '0', message: 'Enter an amount greater than R0.', status: 400 },
  {
    title: 'below the R100 minimum',
    raw: '99.99',
    message: 'Minimum withdrawal is R100.',
    status: 400,
  },
  {
    title: 'above the cumulative cap',
    raw: '70000.01',
    message: 'You can withdraw up to R70,000 from this investment.',
    status: 422,
  },
  {
    title: 'above available funds',
    raw: '80000.01',
    message: 'Your available balance for this investment is R80,000.',
    status: 422,
  },
];

for (const scenario of invalidAmounts) {
  test(`invalid amount: ${scenario.title} leaves balances and records unchanged`, async ({
    page,
    backend,
  }) => {
    const before = await backend.snapshot();
    const summary = await openInvestment(page, cash.name);
    const dialog = await openWithdrawal(page);
    const posts: string[] = [];
    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        new URL(request.url()).pathname.endsWith('/withdrawal-notices')
      )
        posts.push(request.url());
    });
    await dialog.getByLabel('Amount', { exact: true }).fill(scenario.raw);
    await dialog.getByRole('button', { name: 'Confirm withdrawal', exact: true }).click();
    await expect(dialog.getByRole('alert')).toHaveText(scenario.message);
    await expect(dialog.getByLabel('Amount', { exact: true })).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    await expect(
      page.getByRole('heading', { name: 'Withdrawal submitted successfully', exact: true })
    ).toHaveCount(0);
    expect(posts).toEqual([]);
    expect(await backend.snapshot()).toEqual(before);

    // The same input also goes to the real backend, independently of UI validation.
    const rejected = await backend.create(cash.id, Number(scenario.raw));
    expect(rejected.status()).toBe(scenario.status);
    expect((await rejected.json()).message).toMatch(
      /greater than R0|Minimum withdrawal|You can withdraw up to|available balance/
    );
    expect(await backend.snapshot()).toEqual(before);
    await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await page.reload();
    await expectBalance(summary, cash.underlying - cash.reserved);
    await openHistory(page);
    await expectHistory(page, before.history);
  });
}

test('negative input is refused and the real backend rejects negative amounts', async ({
  page,
  backend,
}) => {
  const before = await backend.snapshot();
  const summary = await openInvestment(page, cash.name);
  const dialog = await openWithdrawal(page);
  const posts: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST') posts.push(request.url());
  });
  const amount = dialog.getByLabel('Amount', { exact: true });
  await amount.fill('-100');
  // CurrencyInput refuses negative edits instead of silently turning them positive.
  await expect(amount).toHaveValue('');
  await dialog.getByRole('button', { name: 'Confirm withdrawal', exact: true }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Enter an amount to withdraw.');
  expect(posts).toEqual([]);
  const rejected = await backend.create(cash.id, -100);
  expect(rejected.status()).toBe(400);
  expect((await rejected.json()).message).toContain('Enter an amount greater than R0.');
  expect(await backend.snapshot()).toEqual(before);
  await expect(
    page.getByRole('heading', { name: 'Withdrawal submitted successfully', exact: true })
  ).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expectBalance(summary, cash.underlying - cash.reserved);
  await openHistory(page);
  await expectHistory(page, before.history);
});

test('stale form displays a real backend rejection after another client reserves the cap', async ({
  page,
  backend,
}) => {
  const summary = await openInvestment(page, cash.name);
  const dialog = await openWithdrawal(page);
  await dialog.getByLabel('Amount', { exact: true }).fill('1500.75');

  const competingAmount = (Math.floor((cash.underlying * 90) / 100) - cash.reserved) / 100;
  expect((await backend.create(cash.id, competingAmount)).status()).toBe(201);
  const beforeRejectedRequest = await backend.snapshot();
  const rejected = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith('/withdrawal-notices') &&
      response.request().method() === 'POST'
  );
  await dialog.getByRole('button', { name: 'Confirm withdrawal', exact: true }).click();
  expect((await rejected).status()).toBe(422);
  await expect(dialog.getByRole('alert')).toHaveText(
    'You can withdraw up to R0.00 from this investment.'
  );
  await expect(dialog.getByLabel('Amount', { exact: true })).toHaveValue('1,500.75');
  await expect(
    page.getByRole('heading', { name: 'Withdrawal submitted successfully', exact: true })
  ).toHaveCount(0);
  // Compare with the state AFTER the competing request, proving the rejected request added nothing.
  expect(await backend.snapshot()).toEqual(beforeRejectedRequest);
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.reload();
  await expectBalance(summary, cash.underlying - cash.reserved - cents(competingAmount));
  await expect(summary.getByRole('button', { name: 'Withdraw money', exact: true })).toBeDisabled();
  await openHistory(page);
  await expectHistory(page, beforeRejectedRequest.history);
});
