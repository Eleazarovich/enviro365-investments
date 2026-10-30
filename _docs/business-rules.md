# Withdrawal business rules

Withdrawals use a cumulative per-product 90% cap and a R100 minimum. The backend
validates each request and reserves the amount when it creates the notice.

## Withdrawal rules

- Withdrawal amounts must be positive.
- Retirement withdrawals require an investor **older than 65**; age 65 is ineligible.
- An amount cannot exceed the available product balance or the 90% restriction.
- Notices persist; invalid requests leave balances and records unchanged.
- Responses provide meaningful errors the frontend can display.

## Policy and implementation

| Topic | Policy | Implementation |
| --- | --- | --- |
| Retirement | Investor must be older than 65 | Calculate age from stored date of birth using UTC |
| Available funds | Withdrawal cannot exceed the balance | Subtract active submitted notices from the recorded balance |
| 90% limit | Withdrawal cannot exceed 90% of the balance | Share one cumulative cap across active notices per product |
| Minimum amount | Each request must be at least R100 | Allow up to two decimal places |
| Submission | Create a withdrawal notice with correct balances | Save one notice as the reservation; execute no payment |

The cumulative cap leaves at least 10% of the recorded balance unreserved across
repeated requests. The R100 minimum excludes small requests.

## Reservation calculations

- All **active submitted notices share a cumulative cap** of 90% of the underlying
  recorded balance for that product. They do not each receive a fresh 90% allowance.
- A submission inserts an active notice, which is itself the reservation, without
  changing the underlying balance.
- Available funds exclude active reservations once. The cap also starts from the
  underlying balance, avoiding a second deduction from already-reduced available funds.
- Retain the established **R100 minimum**, with up to two decimals. No exception clears
  a final small balance. Keep the actual balance visible when no request fits.
- Imported historical notices may have inactive reservations already reflected in
  recorded balances. They remain visible as `SUBMITTED` without reserving funds again.
- This application records requests. It executes no bank payments and exposes no
  endpoint to settle, cancel or release reservations.

```text
available = max(0, underlyingBalance - activeReservations)
remainingCap = floorToCents(underlyingBalance * 0.90) - activeReservations
candidateMaximum = max(0, min(available, remainingCap))
maximumWithdrawable = candidateMaximum >= 100.00 ? candidateMaximum : 0.00
```

Java uses `BigDecimal` and decimal database columns. The frontend validates against
API-provided minimum and maximum amounts; it has no separate balance/cap calculator.

## Examples

| Underlying | Reserved before | Available before | Maximum new request | Available after maximum | Next maximum |
| --- | --- | --- | --- | --- | --- |
| R100,000 | R20,000 | R80,000 | R70,000 | R10,000 | R0 |
| R60,000 | R0 | R60,000 | R54,000 | R6,000 | R0 |
| R1,000 | R600 | R400 | R300 | R100 | R0 |
| R111.12 | R0 | R111.12 | R100 | R11.12 | R0 |
| R111.11 | R0 | R111.11 | R0 | R111.11 | R0 |
| R0 | R0 | R0 | R0 | R0 | R0 |

A R1,500.75 cash request leaves **R78,499.25 available** and a **R68,499.25 maximum**,
with R21,500.75 reserved against the R100,000 underlying balance. The total available
portfolio becomes R138,499.25.

## Atomicity and verification

The service uses `PESSIMISTIC_WRITE` on the investor-scoped product before reading
active reservation totals. `READ_COMMITTED` lets a waiting writer see the preceding
transaction's committed notices. Validation and insertion share a transaction. Invalid
requests and rollbacks leave both history and derived available funds unchanged.

Backend tests cover monetary boundaries, ages 64/65/66, birthdays, repeated requests,
rollback, ten concurrent transactions, filters, CSV and restart persistence. Browser
tests cover actual cross-origin Spring Boot calls. See
[backend verification](backend-verification.md) and [backend README](../backend/README.md).

## Explaining one withdrawal

1. The controller validates the request fields and identifies the investor/product.
2. The service locks that product, reads existing reservations and checks the rules.
3. A valid request inserts one notice in the same transaction. An invalid request
   inserts nothing. The notice itself reserves the amount, so no second balance
   update or stored reservation counter is needed.
4. The frontend reloads the portfolio and history from the API. Available funds are
   the recorded balance less active notices. History and CSV show negative deductions.

For example, a product with R1,000 and no reservations allows a R900 request. After
submission, R100 remains available and the cumulative cap allows no further request.
The product lock prevents two simultaneous requests from both using the old limit.
