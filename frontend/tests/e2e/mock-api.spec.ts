import { expect, test } from '@playwright/test';
import { mockApi } from '../../src/lib/api/mockApi';
import {
  computeProduct,
  mockInvestor,
  mockProductRecords,
  mockState,
} from '../../src/lib/api/mockStore';

// Exercise the real mock adapter; HTTP browser fixtures cannot verify its calculations.
const originalNotices = mockState.notices.map((notice) => ({ ...notice }));
const originalBalances = mockProductRecords.map((product) => product.recordedBalance);
const originalAge = mockInvestor.age;
const originalNextId = mockState.nextId;

test.beforeEach(() => {
  mockState.notices = originalNotices.map((notice) => ({ ...notice }));
  mockState.nextId = originalNextId;
  mockInvestor.age = originalAge;
  mockProductRecords.forEach((product, index) => {
    product.recordedBalance = originalBalances[index];
  });
});

for (const [productId, states] of [
  [
    1,
    [
      [80000, 72000],
      [8000, 7200],
      [800, 720],
      [80, 0],
    ],
  ],
  [
    2,
    [
      [60000, 54000],
      [6000, 5400],
      [600, 540],
      [60, 0],
    ],
  ],
] as const) {
  test(`mock investment ${productId} permits repeated maximum withdrawals until below the minimum`, async () => {
    const record = mockProductRecords.find((product) => product.id === productId)!;
    const before = structuredClone(mockState);
    await expect(
      mockApi.createWithdrawal({ productId, amount: states[0][1] + 0.01 })
    ).rejects.toMatchObject({ code: 'LIMIT_EXCEEDED' });
    expect(mockState).toEqual(before);
    for (const [balance, maximum] of states) {
      expect(computeProduct(record)).toMatchObject({
        availableBalance: balance,
        minimumWithdrawable: 100,
        maximumWithdrawable: maximum,
      });
      if (maximum === 0) break;
      const notice = await mockApi.createWithdrawal({ productId, amount: maximum });
      expect(notice).toMatchObject({ productId, amount: maximum, status: 'SUBMITTED' });
    }
    expect(mockState.notices).toHaveLength(before.notices.length + 3);
    expect(new Set(mockState.notices.map((notice) => notice.id)).size).toBe(
      mockState.notices.length
    );
    const after = structuredClone(mockState);
    await expect(mockApi.createWithdrawal({ productId, amount: 100 })).rejects.toMatchObject({
      code: 'INSUFFICIENT_BALANCE',
    });
    expect(mockState).toEqual(after);
    const portfolio = await mockApi.getPortfolio();
    expect(portfolio.totalAvailable).toBe(productId === 1 ? 60080 : 80060);
    const statement = await mockApi.exportWithdrawals({ productId });
    expect(statement.content).toContain(productId === 1 ? ',-720.00' : ',-540.00');
  });
}

test('mock maximum floors cents and returns zero when no R100 request fits', () => {
  const record = mockProductRecords[0];
  for (const [availableCents, maximumCents] of [
    [0, 0],
    [1, 0],
    [10000, 0],
    [11111, 0],
    [11112, 10000],
    [11113, 10001],
    [123456, 111110],
    [7849925, 7064932],
  ]) {
    // The existing R20,000 notice must be subtracted before the percentage is applied.
    record.recordedBalance = (2000000 + availableCents) / 100;
    expect(computeProduct(record)).toMatchObject({
      availableBalance: availableCents / 100,
      minimumWithdrawable: 100,
      maximumWithdrawable: maximumCents / 100,
    });
  }
});

test('mock minimum boundary and fractional withdrawals preserve cents', async () => {
  const before = structuredClone(mockState);
  await expect(mockApi.createWithdrawal({ productId: 1, amount: 99.99 })).rejects.toMatchObject({
    code: 'VALIDATION_ERROR',
    message: 'Minimum withdrawal is R100.',
  });
  expect(mockState).toEqual(before);
  await mockApi.createWithdrawal({ productId: 1, amount: 1500.75 });
  expect(computeProduct(mockProductRecords[0])).toMatchObject({
    availableBalance: 78499.25,
    maximumWithdrawable: 70649.32,
  });
  mockState.notices = [];
  mockProductRecords[0].recordedBalance = 111.12;
  await mockApi.createWithdrawal({ productId: 1, amount: 100 });
  expect(computeProduct(mockProductRecords[0])).toMatchObject({
    availableBalance: 11.12,
    maximumWithdrawable: 0,
  });
  const after = structuredClone(mockState);
  await expect(mockApi.createWithdrawal({ productId: 1, amount: 11.12 })).rejects.toMatchObject({
    code: 'LIMIT_EXCEEDED',
  });
  expect(mockState).toEqual(after);
});

test('concurrent mock requests recheck the remaining balance and percentage limit', async () => {
  mockState.notices = [];
  mockProductRecords[0].recordedBalance = 1000;
  const requests = await Promise.allSettled([
    mockApi.createWithdrawal({ productId: 1, amount: 600 }),
    mockApi.createWithdrawal({ productId: 1, amount: 400 }),
  ]);
  expect(requests[0]).toMatchObject({ status: 'fulfilled' });
  expect(requests[1]).toMatchObject({ status: 'rejected', reason: { code: 'LIMIT_EXCEEDED' } });
  expect(mockState.notices).toHaveLength(1);
  expect(computeProduct(mockProductRecords[0])).toMatchObject({
    availableBalance: 400,
    maximumWithdrawable: 360,
  });
});

test('retirement age and invalid money rules still apply to repeated mock withdrawals', async () => {
  for (const age of [64, 65]) {
    mockInvestor.age = age;
    const before = structuredClone(mockState);
    await expect(mockApi.createWithdrawal({ productId: 2, amount: 100 })).rejects.toMatchObject({
      code: 'NOT_ELIGIBLE',
    });
    expect(mockState).toEqual(before);
    await expect(mockApi.createWithdrawal({ productId: 1, amount: 100 })).resolves.toMatchObject({
      amount: 100,
    });
  }
  mockInvestor.age = 66;
  await expect(mockApi.createWithdrawal({ productId: 2, amount: 100 })).resolves.toMatchObject({
    amount: 100,
  });
  for (const amount of [0, -1, 0.001]) {
    const before = structuredClone(mockState);
    await expect(mockApi.createWithdrawal({ productId: 1, amount })).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
    expect(mockState).toEqual(before);
  }
});
