import { expect, test } from '@playwright/test';

test('mobile investor can submit a withdrawal and navigate to history', async ({ page }) => {
  await page.goto('/');
  await page.locator('a[href="/investment-detail?id=1"]').click();
  await page.getByRole('button', { name: 'Withdraw money', exact: true }).click();
  await page.getByRole('textbox', { name: 'Amount', exact: true }).fill('100.25');
  await page.getByRole('button', { name: 'Confirm withdrawal', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Withdrawal submitted successfully', exact: true })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page
    .getByRole('link', { name: 'Withdrawals', exact: true })
    .filter({ visible: true })
    .click();
  await expect(
    page.locator('main').getByText('-R100.25', { exact: true }).filter({ visible: true })
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  );
});
