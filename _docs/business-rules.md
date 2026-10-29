# Withdrawal business rules

## Withdrawal rules

| Rule | Applies to |
| --- | --- |
| Investor age must be greater than 65 for retirement withdrawals. Age 65 is ineligible. | Retirement investments |
| A withdrawal must not exceed the balance. | Both cash and retirement investments |
| "Withdrawal must not exceed 90% of balance" | Both cash and retirement investments |
| Provide proper error handling and user feedback. | Both products |

## Confirmed project policy

On 29 October 2026 the user selected:

- Apply the 90% limit to the **remaining available balance on each request**, for
  both cash and retirement products. Replace the former cumulative cap.
- Require at least **R100** per request. Larger amounts can still include cents,
  such as R1,500.75.
- Keep the 90% rule and **disable withdrawals below the minimum**. Do not allow a
  special final-cent payment or a full-remainder withdrawal. This supersedes the
  earlier proposal to allow a final R0.01 request.
- Preserve the actual remaining balance. An unavailable withdrawal is not a zero
  investment balance, a fee, or money lost by the investor.

Pending notices reduce the available balance once. Recalculating 90% of that
available balance must not subtract pending amounts a second time. Round the
percentage maximum **down** to cents so rounding never permits more than 90%.

```text
availableCents = max(0, recordedCents - pendingCents)
minimumCents = 10000
percentageMaximumCents = floor(availableCents * 9 / 10)
maximumCents = percentageMaximumCents >= minimumCents ? percentageMaximumCents : 0
```

The mock adapter uses integer cents in
[`computeProduct`](../frontend/src/lib/api/mockStore.ts). The future Java backend
must implement the same rule with `BigDecimal` and downward rounding, recheck the
limits inside its transaction, and return the current `minimumWithdrawable` and
`maximumWithdrawable` amounts. Frontend validation consumes those API amounts;
it does not calculate an authoritative limit.

## Examples

| Available before a request | Maximum request | Available after that maximum | Next maximum |
| --- | --- | --- | --- |
| R80,000 (demo cash, after R20,000 pending) | R72,000 | R8,000 | R7,200 |
| R60,000 (demo retirement) | R54,000 | R6,000 | R5,400 |
| R10,000 | R9,000 | R1,000 | R900 |
| R111.12 | R100 | R11.12 | R0 |
| R111.11 | R0 | R111.11 (no request permitted) | R0 |
| R0 | R0 | R0 (no request permitted) | R0 |

A balance slightly above R100 can also be unavailable: 90% of R111.11 rounds down
to R99.99, which is below the R100 minimum. Do not permit R100 in that case or
silently clear the balance. The UI shows the actual balance, a maximum of R0, and
a disabled action without an additional explanatory paragraph.

## Verification

[`mock-api.spec.ts`](../frontend/tests/e2e/mock-api.spec.ts) exercises the actual
mock API: repeated maximum requests on both products, unchanged records after
rejection, R99.99/R100 boundaries, fractional amounts, downward cent rounding,
concurrent requests, and retirement ages 64/65/66. The browser suite checks the
HTTP adapter contract, balance and history refresh, repeated withdrawals, the
minimum hint and validation, and disabled actions below the minimum and at zero.

These checks verify the frontend and mock implementation. They do not establish
live Spring Boot/H2 persistence or concurrent database transaction correctness;
that backend has not yet been implemented.
