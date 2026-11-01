# Enviro365 Investments — Backend

Java 21, Spring Boot 4.1.2, Spring Data JPA, Jakarta Validation, and H2.
The REST API retrieves portfolios, persists withdrawal notices, and exports
filtered CSV statements. Base package: `com.enviro.assessment.junior.eleazar`.

## Setup

Requires a **Java 21 JDK**. The Maven Wrapper supplies Maven **3.9.16**.
From `backend/`:

```sh
./mvnw spring-boot:run
```

The API runs on `http://localhost:8080`. On Windows, use `mvnw.cmd`.
To test, package, and run the executable JAR:

```sh
./mvnw clean verify
java -jar target/enviro365-1.0.0.jar
```

## Configuration and persistence

| Environment variable | Default |
| --- | --- |
| `SERVER_PORT` | `8080` |
| `DB_URL` | `jdbc:h2:file:./data/enviro365;DB_CLOSE_ON_EXIT=FALSE;LOCK_TIMEOUT=10000` |
| `DB_USERNAME` / `DB_PASSWORD` | `sa` / empty |
| `SEED_ENABLED` | `true` |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:4028,http://127.0.0.1:4028` |

Local data persists in `backend/data/`. An empty database seeds investor **1**,
two investments, and nine notices. Cash starts with **R80,000 available** and a
**R70,000 maximum**; retirement has **R60,000 available** and a **R54,000 maximum**.
Historical inactive reservations are already reflected in recorded balances and
do not reserve funds again. Restarting preserves submitted notices.

## API usage

The root README lists the four endpoints; `openapi.yaml` defines their schemas.
Create a notice with a numeric product ID and amount:

```sh
curl -i http://localhost:8080/api/investors/1/withdrawal-notices \
  -H 'Content-Type: application/json' \
  -d '{"productId":1,"amount":1500.75}'
```

History and export share `productId`, `fromDate`, and `toDate` filters. For example:

```sh
curl -OJ 'http://localhost:8080/api/investors/1/withdrawal-notices/export?productId=1&fromDate=2026-09-30&toDate=2026-09-30'
```

CSV columns are `Date,Investment,Amount`, with negative deductions and two decimal
places. JSON amounts remain positive; notices retain `SUBMITTED` status.

## Design and validation

Controllers accept validated DTOs. Services enforce the R100 minimum, two-decimal
precision, retirement age >65, available balance, and cumulative 90% cap. Money
uses `BigDecimal` and H2 decimal columns; the cap rounds down to cents.

A notice is the reservation. The service locks the investor-owned product before
reading reservations, then validates and inserts within one transaction.
`PESSIMISTIC_WRITE` with `READ_COMMITTED` prevents concurrent requests from using
the same funds. Invalid or rolled-back requests leave records and balances unchanged.

Centralized exception handling returns `{"message":"..."}`:

| Status | Meaning |
| --- | --- |
| `400` | Invalid request fields, amount, IDs, or date filters |
| `404` | Investor or investment not found |
| `409` | Lock conflict; refresh and retry |
| `422` | Age, balance, or cumulative-limit rejection |
| `405` / `415` | Unsupported method or content type |
| `500` | Generic failure; details remain in server logs |

## Tests

```sh
./mvnw test
```

JUnit, Mockito, and Spring Boot/MockMvc tests cover portfolio retrieval, age and
money boundaries, repeated and concurrent requests, rollback, filters, CSV,
errors, CORS, seeding, and file persistence across restarts. Tests use isolated H2
databases. The frontend Playwright suite verifies real HTTP integration.

[Project README](../README.md) contains requirements coverage, architecture,
screenshots, and the AI-use disclosure.
