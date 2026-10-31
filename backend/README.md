# Enviro365 Investments — Backend

REST API for investor portfolios, persisted withdrawal notices, and filtered CSV
statements. Built with **Java 21**, **Spring Boot 4.1.2**, Spring Data JPA,
Jakarta Validation, and **H2**. The base package is
`com.enviro.assessment.junior.eleazar`.

[Project overview](../README.md) · [Frontend](../frontend/README.md) ·
[OpenAPI contract](../openapi.yaml)

## Run locally

Install a **Java 21 JDK**. The Maven Wrapper downloads Maven **3.9.16** and
dependencies on first use.

From `backend/`:

```sh
./mvnw spring-boot:run
```

The API runs at [http://localhost:8080](http://localhost:8080). On Windows, use
`mvnw.cmd` in place of `./mvnw`. Start the [frontend](../frontend/README.md#run-locally)
separately, or run `make run` from the repository root to start both services.

To test, package, and run the executable JAR:

```sh
./mvnw clean verify
java -jar target/enviro365-1.0.0.jar
```

## Configuration and data

All settings are optional for local development.

| Environment variable | Default |
| --- | --- |
| `SERVER_PORT` | `8080` |
| `DB_URL` | `jdbc:h2:file:./data/enviro365;DB_CLOSE_ON_EXIT=FALSE;LOCK_TIMEOUT=10000` |
| `DB_USERNAME` | `sa` |
| `DB_PASSWORD` | Empty |
| `SEED_ENABLED` | `true` |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:4028,http://127.0.0.1:4028` |

H2 stores data in `backend/data/enviro365.mv.db` when started from `backend/`.
Notices survive restarts; seeding runs only when the investor table is empty.
Database files are ignored by Git. The H2 browser console is disabled; stop the
backend before JDBC inspection. Tests use isolated databases.

Fresh data contains fictional investor **1**, born **1 October 1958**, with nine
notices and the following investments:

| Investment | Recorded balance | Active reservations | Available | Maximum withdrawal |
| --- | ---: | ---: | ---: | ---: |
| 1 — Cash (`GENERAL`) | R100,000.00 | R20,000.00 | R80,000.00 | R70,000.00 |
| 2 — Retirement (`RETIREMENT`) | R60,000.00 | R0.00 | R60,000.00 | R54,000.00 |

One notice reserves R20,000 in cash. Eight imported historical notices have inactive
reservations already reflected in recorded balances. They remain `SUBMITTED` in
the API without reserving funds again. The internal active flag is not exposed.

## API

Paths are relative to `http://localhost:8080`. DTO responses use numeric ZAR amounts.

| Method | Endpoint | Success response |
| --- | --- | --- |
| GET | `/api/investors/{investorId}/portfolio` | `200`: investor, products, balances, minimums, and maximums |
| POST | `/api/investors/{investorId}/withdrawal-notices` | `201`: created notice |
| GET | `/api/investors/{investorId}/withdrawal-notices` | `200`: notices, newest first |
| GET | `/api/investors/{investorId}/withdrawal-notices/export` | `200`: UTF-8 CSV attachment |

Retrieve the portfolio and create a notice:

```sh
curl http://localhost:8080/api/investors/1/portfolio

curl -i http://localhost:8080/api/investors/1/withdrawal-notices \
  -H 'Content-Type: application/json' \
  -d '{"productId":1,"amount":1500.75}'
```

History and CSV share optional `productId`, `fromDate`, and `toDate` filters,
combined with AND. Dates use `YYYY-MM-DD` and include the entire start and end days
in UTC. Unknown product filters return no matches; an unknown investor returns `404`.

```sh
curl 'http://localhost:8080/api/investors/1/withdrawal-notices?productId=1&fromDate=2026-09-30&toDate=2026-09-30'

curl -OJ 'http://localhost:8080/api/investors/1/withdrawal-notices/export?productId=1&fromDate=2026-09-30&toDate=2026-09-30'
```

CSV uses `Date,Investment,Amount`, negative deductions, and two decimal places.
JSON notice amounts remain positive. Empty exports contain the header only.
CORS exposes `Content-Disposition` for the download filename. See
[openapi.yaml](../openapi.yaml) for schemas and examples.

### Errors

Centralized exception handling returns JSON with a top-level `message`, for example
`{"message":"Minimum withdrawal is R100."}`.

| Status | Meaning |
| --- | --- |
| `400` | Invalid JSON, fields, IDs, amounts, or date filters |
| `404` | Investor or requested investment not found |
| `409` | Database lock conflict; refresh the balance and retry |
| `422` | Retirement eligibility, available balance, or cumulative cap failure |
| `405` / `415` | Unsupported HTTP method or content type |
| `500` | Generic failure message; exception details stay in server logs |

Requests accept numeric `productId` and `amount` only. Unknown fields, numeric
strings, and fractional IDs are rejected; clients cannot set age, status, or balances.

## Financial rules and design

Amounts must be positive, at least **R100**, and have at most two decimal places.
Retirement requires age **strictly greater than 65**, calculated from the stored
date of birth using UTC. Both product types share the same cumulative 90% policy.

For recorded balance `B` and active submitted reservations `R`:

```text
available = max(0, B - R)
remainingCap = floorToCents(B × 0.90) - R
candidateMaximum = max(0, min(available, remainingCap))
maximumWithdrawable = candidateMaximum >= 100.00 ? candidateMaximum : 0.00
```

Java uses `BigDecimal` and H2 `NUMERIC(19,2)` for money. The maximum is rounded down;
a recorded balance of R111.12 permits R100, while R111.11 permits no withdrawal.
The actual balance remains visible when no request fits.

A notice is itself the reservation; submitting it leaves the recorded balance
unchanged. Validation and insertion share one transaction. `PESSIMISTIC_WRITE`
locks the investor-owned product before reservations are read; `READ_COMMITTED`
allows the next writer to see committed reservations. This prevents concurrent
requests from overdrawing or bypassing the cap. Rejected or rolled-back requests
leave data unchanged. New reservation writers must follow the same lock protocol.

| Package | Responsibility |
| --- | --- |
| `controller`, `dto` | REST endpoints and validated request/response records |
| `service` | Portfolio mapping, financial rules, transactions, filters, and CSV |
| `repository`, `entity` | JPA queries, product locks, and persistence |
| `exception` | Domain errors and centralized HTTP error handling |
| `config` | CORS, UTC clock, strict JSON parsing, and demo seeding |

See [business rules and withdrawal walkthrough](../_docs/business-rules.md) for
examples. No payments, cancellations, or reservation releases are implemented.

## Tests

From `backend/`:

```sh
./mvnw test
```

Spring Boot manages JUnit Jupiter and Mockito. Unit and Spring Boot/MockMvc tests
cover portfolio retrieval, monetary and age boundaries, cumulative limits,
concurrent requests, rollback, filters, CSV, errors, CORS, seeding, and restart persistence.

The [frontend browser suite](../frontend/README.md#checks) tests the integrated
application against disposable Spring Boot/H2. See the
[verification record](../_docs/TASKS.md#k-cicd-verification) for previously recorded results.

## AI use

OpenAI Codex assisted with Java implementation, financial calculations, API
integration, tests, and documentation. See the [project AI disclosure](../README.md#ai-use)
for the full scope and review status.
