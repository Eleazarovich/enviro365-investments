# Withdrawal business rule review

## Withdrawal rules

| Rule | Applies to |
| --- | --- |
| Investor age must be greater than 65 for retirement withdrawals. Age 65 is ineligible. | Retirement investments |
| A withdrawal must not exceed the balance. | Both cash and retirement investments |
| "Withdrawal must not exceed 90% of balance" | Both cash and retirement investments |
| Provide proper error handling and user feedback. | Both products |

The 90% limit applies to both cash and retirement products. A single request
cannot withdraw the entire balance.

## Current project policy

`AGENTS.md` explicitly selects a cumulative cap including active pending notices.
The mock adapter implements that policy in
[`computeProduct`](../frontend/src/lib/api/mockStore.ts):

```text
available = recorded balance - pending
maximum = max(0, min(available, 0.9 * recorded balance - pending))
```

The demo cash investment starts with R100,000 recorded, R20,000 already pending,
R80,000 available, and a maximum additional request of R70,000. Requesting that
R70,000 leaves R10,000 available and a maximum additional withdrawal of R0. The
remaining balance still belongs to the investor. It is unavailable for another
request under the selected pending-notice policy. The application has no notice-settlement workflow
that releases pending amounts.

## Alternative interpretation requiring a policy decision

Under a limit of 90% of the current available balance **per request**, the next
maximum would be recalculated after each accepted request, with pending amounts
excluded from the available balance. For example, starting with an unencumbered
R100,000:

| State | Balance after submitted requests | Current cumulative policy: next maximum | Per-request interpretation: next maximum |
| --- | --- | --- | --- |
| Before any request | R100,000 | R90,000 | R90,000 |
| After requesting R90,000 | R10,000 | R0 | R9,000 |

Under the per-request formula, the next maximum would be R9,000. The
implemented cumulative policy returns R0 after the first maximum request.

## Verification

The mock API was exercised directly during this review. Both product types accept
their current cumulative maximum and reject one cent above it. After the maximum,
cash has R10,000 remaining and retirement has R6,000 remaining, each with a next
maximum of R0. Further requests are rejected without changing records or balances.
Retirement requests are rejected at ages 64 and 65 and accepted at 66; the
retirement age restriction does not apply to cash.

This verifies the current mock implementation. Live Spring Boot/H2 persistence
and concurrent database transactions are outside this check. No financial policy
or application behaviour was changed as part of this review.
