import { test, expect } from '../support/fixtures';
import { cash, cents, rand, retirement, seededPortfolio } from '../support/data';
import { expectBalance } from '../support/ui';

test('portfolio shows the available total and products, opens details, and returns', async ({
  page,
  backend,
}) => {
  const expected = seededPortfolio();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Portfolio value', exact: true })).toBeVisible();
  const portfolio = page.getByRole('region', { name: 'Portfolio value', exact: true });
  await expect(portfolio.getByText('Total available balance', { exact: true })).toBeVisible();
  await expect(portfolio).toContainText(rand(cents(expected.totalAvailable), true));
  await expect(page.getByRole('heading', { name: 'Your investments', exact: true })).toBeVisible();
  for (const product of [cash, retirement]) {
    const card = page.getByRole('link', { name: new RegExp(product.name) });
    await expect(card).toBeVisible();
    await expect(card).toContainText(rand(product.underlying - product.reserved));
    await expect(card).toContainText('View investment');
  }
  await page.getByRole('link', { name: /Cash Investment/ }).click();
  await expect(page).toHaveURL(/\/investment-detail\?id=1$/);
  await expect(page.getByRole('heading', { name: cash.name, exact: true })).toBeVisible();
  await expectBalance(
    page.getByRole('region', { name: cash.name, exact: true }),
    cash.underlying - cash.reserved
  );
  await page.getByRole('link', { name: 'Back to portfolio', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(portfolio).toBeVisible();
  expect(await backend.portfolio()).toEqual(expected);
});
