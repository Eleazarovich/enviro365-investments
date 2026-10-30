# Enviro365 backend

Java 21, Spring Boot 4.1.2, Spring MVC, Spring Data JPA, Jakarta Validation and H2.
The package is `com.enviro.assessment.junior.eleazar`. Maven dependencies are managed
by Spring Boot; JUnit Jupiter is explicitly pinned to **5.14.4**.
There is no authentication, registration or payment execution.

## Start

Prerequisites: a Java **21 JDK**, network access for the first Maven download, and
Node.js/npm for the existing frontend. A global Maven installation is unnecessary.

From `backend/`:

```sh
./mvnw spring-boot:run
```

On Windows use `mvnw.cmd`. The checked-in Maven Wrapper uses Maven **3.9.16**.
The API runs at http://localhost:8080. In a second terminal, from `frontend/`:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:4028. HTTP is the default adapter. The example sets
`NEXT_PUBLIC_USE_MOCK_API=false` and `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`
(the base URL must **not** include `/api`). Restart Next.js after changing these
variables. Set `NEXT_PUBLIC_USE_MOCK_API=true` only for the optional browser mock.

To build and run the packaged backend:

```sh
./mvnw clean verify
java -jar target/enviro365-1.0.0.jar
```

## Structure

All packages are below `src/main/java/com/enviro/assessment/junior/eleazar/`:

| Package | Responsibility |
| --- | --- |
| `controller` | Thin REST endpoints; validation and HTTP responses |
| `service` | Portfolio mapping, withdrawal rules, transactions, filtering and CSV |
| `repository` | Spring Data JPA queries and the product row lock |
| `entity` | Investor, portfolio, product and withdrawal notice persistence |
| `dto` | Request/response records; entities never leave controllers |
| `exception` | Domain errors and centralized JSON error responses |
| `config` | Configurable CORS, UTC clock, JSON parsing and transactional demo seed |

Relations are investor → one portfolio → many products → many withdrawal notices,
enforced by foreign keys and a unique investor/portfolio association. Money uses
`BigDecimal` and H2 `NUMERIC(19,2)` columns. The database also checks positive notice
amounts and nonnegative underlying balances. Open Session in View is disabled.

## H2 and configuration

The default database is **file-backed H2**, `backend/data/enviro365.mv.db` when
started from `backend/`. Notices survive backend restarts and browser reloads.
Files and build output are ignored by Git. Seed data is inserted transactionally
only into an empty investor table; restarting does not reset notices or balances.

| Environment variable | Default / meaning |
| --- | --- |
| `SERVER_PORT` | `8080` |
| `DB_URL` | `jdbc:h2:file:./data/enviro365;DB_CLOSE_ON_EXIT=FALSE;LOCK_TIMEOUT=10000` |
| `DB_USERNAME` / `DB_PASSWORD` | `sa` / empty (local demonstration) |
| `SEED_ENABLED` | `true` |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:4028,http://127.0.0.1:4028` |

For an ephemeral run, set `DB_URL='jdbc:h2:mem:demo;DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000'`.
Tests use isolated databases and do not touch the default data directory. Hibernate
`ddl-auto=update` keeps local startup simple; a production migration system is outside
this application. The H2 browser console is not enabled. With the application stopped,
inspect the file using H2's JDBC Shell with the configured URL, username and password.
For a fresh demo, stop the backend and remove only its local `data/enviro365.mv.db`.

## Demonstration data

Investor **1**, fictional **Eleazarovich**, was born on **1 October 1958** (age 68
on 29 October 2026). Age is calculated from the stored date of birth using a UTC
clock. Investor since **1 April 2026** matches the earliest demonstration history.

| Product | Underlying balance | Active reservations | Available | Maximum new notice |
| --- | ---: | ---: | ---: | ---: |
| 1 — Cash Investment (`GENERAL`) | R100,000.00 | R20,000.00 | R80,000.00 | R70,000.00 |
| 2 — Retirement Investment (`RETIREMENT`) | R60,000.00 | R0.00 | R60,000.00 | R54,000.00 |

The total available is **R140,000.00**. Nine notices span April–October 2026,
including fractional amounts. One reserves R20,000 on cash. Eight imported historical
notices have inactive reservations already accounted for in the recorded balances.
They remain `SUBMITTED` in the public history. Their internal `active` flag is not
returned. No payment lifecycle or endpoint to release a reservation is implemented.

## API

The complete contract is [../openapi.yaml](../openapi.yaml). JSON responses have no
envelope. Money is a JSON number in ZAR; withdrawal JSON amounts are positive.

| Method | Path | Result |
| --- | --- | --- |
| GET | `/api/investors/{investorId}/portfolio` | Investor, products, available balances and limits |
| POST | `/api/investors/{investorId}/withdrawal-notices` | `201`, created notice |
| GET | `/api/investors/{investorId}/withdrawal-notices` | Array of notices, newest first |
| GET | `/api/investors/{investorId}/withdrawal-notices/export` | UTF-8 CSV attachment |

History and CSV accept the same optional `productId`, `fromDate`, and `toDate`
filters, combined with AND. Dates use `YYYY-MM-DD`, inclusive over the entire UTC
day; equal timestamps are ordered by descending notice ID. Unknown product filters
return no matches, and never disclose another investor's records. An unknown investor
or a product missing from the investor's portfolio when submitting returns `404`.

```sh
curl http://localhost:8080/api/investors/1/portfolio
curl -i http://localhost:8080/api/investors/1/withdrawal-notices \
  -H 'Content-Type: application/json' \
  -d '{"productId":1,"amount":1500.75}'
curl 'http://localhost:8080/api/investors/1/withdrawal-notices?productId=1&fromDate=2026-09-01&toDate=2026-10-29'
curl -OJ 'http://localhost:8080/api/investors/1/withdrawal-notices/export?productId=1&fromDate=2026-09-01&toDate=2026-10-29'
```

CSV uses exactly `Date,Investment,Amount`, CRLF record separators, quoted/escaped
investment names, and negative deductions with two decimal places and no grouping.
Empty exports contain only the header. The browser adds the UTF-8 BOM. CORS permits
configured origins, supports JSON POST preflight, and exposes `Content-Disposition`.

Errors have a top-level `message` displayed by the existing HTTP adapter:

- `400`: malformed JSON, missing/invalid fields, nonpositive amounts, more than two
  decimal places, amounts below R100, invalid IDs or date filters.
- `404`: missing investor or investment on submission.
- `422`: ineligible retirement age, insufficient available balance, cumulative cap exceeded.
- `409`: database lock conflict; refresh the balance and retry.
- `405` / `415`: unsupported method / request content type.
- `500`: safe generic message; exception details are logged only on the server.

Numeric strings, fractional product IDs and unknown JSON fields are rejected.
Clients cannot supply investor age, product type, status or a replacement balance.

## Withdrawal policy and concurrency

The latest backend request explicitly requires a **cumulative per-product 90% cap**.
It supersedes the earlier frontend policy of repeatedly taking 90% of the remaining
balance. Endpoint paths and DTO shapes are preserved; contract documentation,
mock calculations and rule copy are aligned. The established **R100 minimum** is
retained, with cents permitted above it.

For each product, with underlying recorded balance `B` and total active submitted
reservations `R`:

```text
available = max(0, B - R)
remainingCap = floorToCents(B × 0.90) - R
candidateMaximum = max(0, min(available, remainingCap))
maximumWithdrawable = candidateMaximum >= 100.00 ? candidateMaximum : 0.00
```

The underlying balance is not reduced when a notice is submitted. The active notice
itself is the reservation, so one database insert records both effects atomically.
No separately stored reservation counter can drift. Active submitted notices count
toward the cap; inactive imported history does not. No payments are executed.
Requests must be positive, have at most two decimals, meet the minimum, fit both
available funds and the remaining cap, and use a product owned by the investor.
Retirement requires **age strictly greater than 65**. Rules are checked in the service,
even when called outside HTTP. Rejections insert nothing and change no balance.

`WithdrawalService.create` uses `@Transactional(isolation = READ_COMMITTED)` and
`PESSIMISTIC_WRITE` on the investor-scoped **product row** before reading active
reservations. Concurrent writers for the same product serialize until commit or
rollback; the next writer then sees the committed reservation sum. Different products
can proceed independently. All future reservation writers must follow this same lock
protocol. A bounded H2 lock timeout becomes a `409`, without a partial reservation.
The lock keeps concurrent requests for the same product in order without optimistic retries.

## Tests

From `backend/`:

```sh
./mvnw test
./mvnw clean verify
```

JUnit **5**, Mockito, Spring MVC Test, full Spring Boot application contexts and real
H2 cover portfolio retrieval, valid/fractional withdrawals, invalid amounts, the minimum,
available and cumulative limits, ages 64/65/66 and birthday boundaries, rollback after
an inserted notice, repeated withdrawals, ten simultaneous database transactions,
ownership, filters and UTC boundaries, CSV escaping, HTTP errors, CORS, idempotent seed,
and file persistence across application restart.

Spring Framework 7.0.10's `SpringExtension` invokes a JUnit 6 API. To preserve the
required JUnit 5 runtime, integration tests explicitly start/close Boot contexts with
`SpringApplicationBuilder` and bind `MockMvc` to the actual web application context.
This tests real MVC, validation, advice, repositories, locking and transactions.
The Mockito Java agent is configured for Java 21 in Surefire.

From `frontend/`:

```sh
npm run type-check
npm run lint
npm run build
npm run test:e2e
```

One six-test browser suite starts Spring Boot/H2 on **8081** and Next.js on
**4029** with `.next-e2e` output. It exercises actual HTTP calls, withdrawals,
refresh/reload, validation, filtered CSV downloads and mobile navigation against
fresh in-memory data. Install Chromium with `npx playwright install chromium`.

## AI-assisted implementation

OpenAI Codex assisted with Java implementation, frontend adapter integration, contract
alignment, tests and documentation. The cumulative cap, reservation model and inactive
history are explicit implementation assumptions. The repository includes executable
checks and a verification report so the developer can review and explain this work.
