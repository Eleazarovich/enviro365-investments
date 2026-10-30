import { test, expect } from '../support/fixtures';
import { retirement } from '../support/data';
import {
  expectBalance,
  expectHistory,
  openHistory,
  openInvestment,
  openWithdrawal,
} from '../support/ui';

for (const age of [64, 65]) {
  test.describe(`retirement investor aged ${age}`, () => {
    test.use({ investorAge: age });

    test('UI and backend reject withdrawal without changing funds or history', async ({
      page,
      backend,
    }) => {
      const before = await backend.snapshot();
      expect(before.portfolio.investor.age).toBe(age);
      const summary = await openInvestment(page, retirement.name);
      await expectBalance(summary, retirement.underlying);
      const dialog = await openWithdrawal(page);
      await expect(dialog.getByRole('textbox')).toHaveCount(1);
      await expect(dialog.getByLabel(/age|date of birth/i)).toHaveCount(0);
      const posts: string[] = [];
      page.on('request', (request) => {
        if (request.method() === 'POST') posts.push(request.url());
      });
      await dialog.getByLabel('Amount', { exact: true }).fill('100');
      await dialog.getByRole('button', { name: 'Confirm withdrawal', exact: true }).click();
      const message = 'Retirement withdrawals are only available to investors older than 65.';
      await expect(dialog.getByRole('alert')).toHaveText(message);
      expect(posts).toEqual([]);
      expect(await backend.snapshot()).toEqual(before);
      const rejected = await backend.create(retirement.id, 100);
      expect(rejected.status()).toBe(422);
      expect((await rejected.json()).message).toBe(message);
      expect(await backend.snapshot()).toEqual(before);
      await expect(
        page.getByRole('heading', { name: 'Withdrawal submitted successfully', exact: true })
      ).toHaveCount(0);
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
      await page.reload();
      await expectBalance(summary, retirement.underlying);
      await openHistory(page);
      await expectHistory(page, before.history);
    });
  });
}
