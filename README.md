# Enviro365 Investments

An investor portfolio and withdrawal application with a Next.js/React frontend and
**Java 21 / Spring Boot 4.1.2 / Spring Data JPA / H2** backend. It records withdrawal
notices and reservations, with no authentication or payment processing.

## Run locally

Install a Java **21 JDK**, Node.js/npm, GNU Make and Bash **4.3+** (Linux or WSL).
From the project root:

```sh
make run
```

This installs frontend dependencies when needed, creates `frontend/.env.local` if
missing, and starts both services. Open http://localhost:4028; press **Ctrl+C** to
stop both. If either service exits, the other is stopped too. Existing local
configuration is preserved. Stop any separately running development servers first
so ports 4028 and 8080 are available.

Run `make help` for all commands. `make backend` and `make frontend` start services
separately; `make test` runs backend tests, `make check` checks frontend types and lint,
`make build` builds both applications, and `make test-e2e` runs the browser suite against Spring Boot/H2.
`make clean` removes build output while retaining H2 data and local configuration.
Browser targets require Chromium (`cd frontend && npx playwright install chromium`).

To start services manually, from `backend/`:

```sh
./mvnw spring-boot:run
```

In a second terminal, from `frontend/`:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:4028. The frontend defaults to HTTP at http://localhost:8080.
Configure `NEXT_PUBLIC_API_BASE_URL` (without `/api`) in `.env.local`; restart
Next.js after changing it. The frontend always calls Spring Boot; there is no
separate browser database or mock mode. Do not place secrets in public variables.

The [backend README](backend/README.md) covers structure, configuration, H2 inspection,
seed data, endpoints, locking and assumptions. The Maven Wrapper pins Maven 3.9.16;
npm dependencies use the existing lockfile.

## Data and withdrawal rules

A fresh database seeds investor **1**, fictional **Eleazarovich**, and two investments.
Cash has R100,000 underlying, R20,000 reserved, R80,000 available and a R70,000 maximum.
Retirement has R60,000 available and a R54,000 maximum. Nine existing notices provide
filterable history. File-backed H2 in `backend/data/` retains notices across restarts.

Active submitted notices share a **cumulative cap of 90% of the underlying product
balance**, rounded down to cents. This follows the latest backend request and supersedes
the earlier frontend policy. Reservations reduce available funds immediately and exactly
once. Keep at least R100 per request; cents are allowed above the minimum. A zero maximum
means no request fits; the actual balance remains visible. Retirement requires age
**strictly greater than 65**. See [business-rule assumptions](_docs/business-rules.md).

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/investors/{investorId}/portfolio` | Investor and products with current balances and limits |
| POST | `/api/investors/{investorId}/withdrawal-notices` | Create a notice with `{ "productId": 1, "amount": 1500.75 }` |
| GET | `/api/investors/{investorId}/withdrawal-notices` | History with optional `productId`, `fromDate`, `toDate` filters |
| GET | `/api/investors/{investorId}/withdrawal-notices/export` | CSV with the same filters |

See [openapi.yaml](openapi.yaml) for complete schemas, inclusive UTC date filters and
errors. JSON withdrawal amounts are positive; the UI and CSV show negative deductions.
CSV columns are `Date,Investment,Amount`. Configure local CORS through
`CORS_ALLOWED_ORIGINS`; the backend exposes `Content-Disposition` to the browser.

## Verification

From `backend/`:

```sh
./mvnw clean verify
```

From `frontend/`:

```sh
npm run type-check
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

Spring Boot manages JUnit Jupiter **6.0.3** and Mockito. Standard
`@SpringBootTest` / `@AutoConfigureMockMvc` tests use real H2 and cover rules,
concurrency, rollback, errors, filtering and CSV. The restart test deliberately
starts two application contexts to check file persistence. OpenAPI remains API
documentation; tests use direct response assertions.

One Playwright suite runs six tests against a disposable Spring Boot/H2 server on
**8081** and Next.js on **4029** (`.next-e2e`). It covers portfolio loading, valid
and invalid withdrawals, refreshed balances/history, filtered CSV downloads, real
backend error feedback and mobile navigation. No Docker or database-reset scripts
are needed. Each run starts with fresh in-memory data and leaves local H2 data alone.

## Design previews and AI use

[Desktop portfolio](_docs/previews/rosewood-porcelain/portfolio-desktop.png) ·
[Mobile portfolio](_docs/previews/rosewood-porcelain/portfolio-mobile.png) ·
[Design system and other previews](_docs/design-system.md)

Existing screenshots document the earlier frontend phase and its previous numerical
limits. The live application uses the current cumulative cap.

OpenAI Codex assisted with frontend and backend implementation, financial calculations,
tests and documentation. Assumptions and verification are recorded so the developer can
review and explain the AI-assisted work.
