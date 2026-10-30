import { expect, test } from '@playwright/test';
import { formatRand } from '../../src/lib/format';
import type { Portfolio } from '../../src/lib/types';

test('exported pages support navigation, refresh, assets and same-origin API calls', async ({
  page,
  request,
  baseURL,
}) => {
  const failures: string[] = [];
  const apiRequests: string[] = [];
  const assets: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
    if (/\.(js|css|woff2?|svg)(\?|$)/.test(response.url())) assets.push(response.url());
  });
  page.on('requestfailed', (req) => {
    if (req.failure()?.errorText !== 'net::ERR_ABORTED') failures.push(req.url());
  });
  page.on('request', (req) => {
    if (new URL(req.url()).pathname.startsWith('/api/')) apiRequests.push(req.url());
  });

  const response = await request.get('/api/investors/1/portfolio');
  expect(response.status()).toBe(200);
  const portfolio: Portfolio = await response.json();
  for (const path of ['/', '/portfolio-dashboard', '/portfolio-dashboard/']) {
    expect((await page.goto(path))?.status()).toBe(200);
    await expect(page).toHaveURL(`${baseURL}/`);
    await expect(
      page.getByRole('heading', { name: 'Your investments', exact: true })
    ).toBeVisible();
  }

  for (const path of ['/investment-detail', '/investment-detail/']) {
    expect((await page.goto(`${path}?id=2`))?.status()).toBe(200);
    await expect(page).toHaveURL(`${baseURL}/investment-detail?id=2`);
    await expect(
      page.getByRole('heading', { name: 'Retirement Investment', exact: true })
    ).toBeVisible();
    const summary = page.getByRole('region', { name: 'Retirement Investment', exact: true });
    await expect(summary.locator('.sr-only')).toHaveText(
      formatRand(portfolio.products[1].availableBalance, true)
    );
    await page.reload();
    await expect(summary).toBeVisible();
  }

  for (const path of ['/withdrawal-history', '/withdrawal-history/']) {
    expect((await page.goto(path))?.status()).toBe(200);
    await expect(page).toHaveURL(`${baseURL}/withdrawal-history`);
    await expect(
      page.getByRole('button', { name: 'Download statement', exact: true })
    ).toBeEnabled();
    await page.reload();
    await expect(
      page.getByRole('button', { name: 'Download statement', exact: true })
    ).toBeEnabled();
  }

  await page
    .getByRole('link', { name: 'Portfolio', exact: true })
    .filter({ visible: true })
    .click();
  await expect(page).toHaveURL(`${baseURL}/`);
  await expect(page.getByRole('heading', { name: 'Your investments', exact: true })).toBeVisible();
  expect(apiRequests.length).toBeGreaterThan(0);
  expect(apiRequests.every((url) => new URL(url).origin === new URL(baseURL!).origin)).toBe(true);
  expect(assets.some((url) => url.endsWith('.css'))).toBe(true);
  expect(assets.some((url) => url.endsWith('.js'))).toBe(true);
  expect(assets.some((url) => url.endsWith('.woff2'))).toBe(true);
  expect(failures).toEqual([]);
});

test('API errors stay JSON and unknown pages keep the existing not-found screen', async ({
  page,
  request,
  baseURL,
}) => {
  for (const path of [
    '/api/unknown',
    '/api/investors/999999/portfolio',
    '/api/investment-detail',
    '/api/withdrawal-history',
    '/_next/static/missing.js',
    '/unknown-page',
  ]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status(), path).toBe(404);
    expect(response.headers()['content-type']).toContain('application/json');
    expect((await response.json()).message).toBeTruthy();
  }
  const browserApiRequest = await request.get('/api/unknown', {
    headers: { Accept: 'text/html' },
    maxRedirects: 0,
  });
  expect(browserApiRequest.status()).toBe(404);
  expect(browserApiRequest.headers()['content-type']).toContain('application/json');
  const wrongMethod = await request.post('/api/investors/1/portfolio', { data: {} });
  expect(wrongMethod.status()).toBe(405);
  const invalid = await request.post('/api/investors/1/withdrawal-notices', {
    data: { productId: 1, amount: 99.99 },
  });
  expect(invalid.status()).toBe(400);
  expect((await invalid.json()).message).toContain('Minimum withdrawal is R100.');

  expect((await page.goto('/unknown-page'))?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Page Not Found', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back to Home', exact: true }).click();
  await expect(page).toHaveURL(`${baseURL}/`);
  await expect(page.getByRole('heading', { name: 'Your investments', exact: true })).toBeVisible();
});
