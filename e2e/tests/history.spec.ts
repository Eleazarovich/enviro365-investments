import { readFile } from 'node:fs/promises';
import type { WithdrawalFilters } from '../../frontend/src/lib/types';
import { test, expect } from '../support/fixtures';
import { cash, cents, filteredHistory, retirement, seededHistory } from '../support/data';
import { applyFilters, expectHistory } from '../support/ui';

test('history filters by investment and inclusive date range, then clears to full history', async ({
  page,
  backend,
}) => {
  await page.goto('/withdrawal-history');
  await expectHistory(page, seededHistory);
  await applyFilters(page, { productId: cash.id });
  await expectHistory(page, filteredHistory({ productId: cash.id }));
  const filters = { productId: cash.id, fromDate: '2026-09-01', toDate: '2026-09-30' };
  const matching = filteredHistory(filters);
  expect(matching).toHaveLength(3);
  await applyFilters(page, filters);
  await expectHistory(page, matching);
  expect(await backend.history(filters)).toEqual(matching);
  await page.getByRole('button', { name: 'Clear selection', exact: true }).click();
  await expect(page.getByLabel('Investment', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('Start date', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('End date', { exact: true })).toHaveValue('');
  await expectHistory(page, seededHistory);
  expect(await backend.history()).toEqual(seededHistory);
});

const statements: { title: string; filters: WithdrawalFilters }[] = [
  { title: 'product', filters: { productId: retirement.id } },
  { title: 'dates', filters: { fromDate: '2026-09-01', toDate: '2026-09-30' } },
  {
    title: 'product and dates',
    filters: { productId: cash.id, fromDate: '2026-09-01', toDate: '2026-09-30' },
  },
];

for (const { title, filters } of statements) {
  test(`CSV download contains exactly the records selected by ${title}`, async ({
    page,
    backend,
  }, testInfo) => {
    await page.goto('/withdrawal-history');
    await expectHistory(page, seededHistory);
    await applyFilters(page, filters);
    const expected = filteredHistory(filters);
    await expectHistory(page, expected);
    expect(await backend.history(filters)).toEqual(expected);
    const exported = page.waitForResponse((response) =>
      new URL(response.url()).pathname.endsWith('/withdrawal-notices/export')
    );
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download statement', exact: true }).click();
    const response = await exported;
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/csv');
    const actualFilters = Object.fromEntries(new URL(response.url()).searchParams.entries());
    expect(actualFilters).toEqual(
      Object.fromEntries(Object.entries(filters).map(([key, value]) => [key, String(value)]))
    );
    const download = await downloading;
    expect(await download.failure()).toBeNull();
    expect(download.suggestedFilename()).toMatch(/^withdrawal-statement-\d{4}-\d{2}-\d{2}\.csv$/);
    const filePath = testInfo.outputPath(download.suggestedFilename());
    await download.saveAs(filePath);
    await testInfo.attach('downloaded-statement', { path: filePath, contentType: 'text/csv' });
    const file = await readFile(filePath, 'utf8');
    expect(file.startsWith('\uFEFF')).toBe(true);
    expect(file.slice(1)).toBe(await response.text());
    const [headers, ...rows] = file.slice(1).split('\r\n');
    expect(headers.split(',')).toEqual(['Date', 'Investment', 'Amount']);
    const parsed = rows.map((row) => {
      const match = /^(\d{4}-\d{2}-\d{2}),"((?:[^"]|"")*)",(-\d+\.\d{2})$/.exec(row);
      expect(match, `Malformed CSV record: ${row}`).not.toBeNull();
      return [match![1], match![2].replace(/""/g, '"'), match![3]];
    });
    expect(parsed).toEqual(
      expected.map((record) => [
        record.submittedAt.slice(0, 10),
        record.productName,
        (-cents(record.amount) / 100).toFixed(2),
      ])
    );
  });
}
