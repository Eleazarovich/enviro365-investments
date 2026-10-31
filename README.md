# Enviro365 Investments

A full-stack application for investors to view their portfolios, submit withdrawal
notices, review withdrawal history, and download filtered CSV statements. Withdrawal
rules are enforced by the backend, and accepted requests immediately reduce the
available balance.

[Live demo](https://enviro365-investments.onrender.com) ·
[Frontend setup](frontend/README.md) · [Backend setup](backend/README.md) ·
[API contract](openapi.yaml)

The demo uses shared fictional data and may take a moment to wake up. Hosted data
resets when Render replaces the instance; local H2 data persists across restarts.
The application records withdrawal notices and does not execute bank payments.

## Features

- Portfolio dashboard with investor details, investment products, and available balances.
- Investment details and a withdrawal form with validation and confirmation.
- Persisted withdrawal history with investment and date filters.
- **Download statement** exports the same filtered records as CSV.
- Responsive desktop and mobile layouts with loading, empty, error, and retry states.

## Technology and structure

| Component | Technology | Location |
| --- | --- | --- |
| Frontend | Next.js App Router, React, TypeScript, Tailwind CSS, Lucide | [frontend/](frontend/README.md) |
| Backend | Java 21, Spring Boot 4.1.2, Spring Data JPA, Jakarta Validation | [backend/](backend/README.md) |
| Database | H2, file-backed for local development | `backend/data/` |
| Tests | JUnit, Mockito, Spring MVC Test, Playwright | `backend/src/test/`, `frontend/tests/e2e/` |

The browser calls Spring Boot through a shared HTTP adapter. Controllers use DTOs,
business rules live in services, and repositories persist records in H2. The
implementation includes global exception handling, DTOs, server-side input
validation, unit tests, and UI validation.

## Run locally

Install a **Java 21 JDK**, **Node.js 24 with npm**, **GNU Make**, and **Bash 4.3+**
(Linux or WSL). First-time setup requires network access for dependencies and fonts.

```sh
git clone https://github.com/Eleazarovich/enviro365-investments.git
cd enviro365-investments
make run
```

Open [http://localhost:4028](http://localhost:4028). The API runs at
[http://localhost:8080](http://localhost:8080). Keep both ports free; **Ctrl+C** stops
both services. `make run` installs frontend dependencies when needed and creates
missing local configuration without overwriting existing settings.

The frontend uses `NEXT_PUBLIC_API_BASE_URL=http://localhost:8080`, without `/api`.
See the component READMEs for manual startup and configuration. Run `make help`
for the available development commands.

A fresh database contains investor **1**, two investments, and nine withdrawal
notices. Cash starts with **R80,000.00 available** and a **R70,000.00 maximum**;
retirement has **R60,000.00 available** and a **R54,000.00 maximum**. The total
available balance is **R140,000.00**.

## Withdrawal rules

- Each request must be positive, at least **R100**, and have at most two decimal places.
- Withdrawals cannot exceed the available balance or the remaining **cumulative 90% cap per investment**, rounded down to cents.
- Retirement withdrawals require age **greater than 65**; exactly 65 is ineligible.
- Accepted notices reserve funds atomically. Invalid requests leave balances and records unchanged; concurrent requests cannot bypass the limits.
- If the remaining limit is below R100, withdrawals are disabled and the actual balance remains visible. There is no remainder exception.

API amounts remain positive and notices retain `SUBMITTED` status. The UI and CSV
show negative deductions; CSV columns are `Date,Investment,Amount`.
See [business rules and worked examples](_docs/business-rules.md) for the reservation
model and calculations. Authentication, deposits, fees, interest, and payment
processing are outside the application scope.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/investors/{investorId}/portfolio` | Investor, products, balances, and withdrawal limits |
| POST | `/api/investors/{investorId}/withdrawal-notices` | Create a notice; returns HTTP 201 |
| GET | `/api/investors/{investorId}/withdrawal-notices` | Withdrawal history, newest first |
| GET | `/api/investors/{investorId}/withdrawal-notices/export` | Download a CSV statement |

POST accepts `{ "productId": 1, "amount": 1500.75 }`. History and export accept
the same optional `productId`, `fromDate`, and `toDate` filters. Dates use
`YYYY-MM-DD` and include both boundary dates in UTC.

See the [backend API examples and errors](backend/README.md#api) and
[OpenAPI contract](openapi.yaml) for request and response details.

## Verification

From the repository root:

```sh
make test                  # Backend tests
make check                 # Frontend TypeScript and lint
make build                 # Package backend and build frontend
cd frontend
npx playwright install chromium
npm run test:e2e
```

The browser suite starts disposable Spring Boot/H2 on **8081** and Next.js on
**4029**; keep these ports free. It uses real API calls and leaves local H2 data
untouched. Chromium also requires its Linux system libraries; CI installs these
with `npx playwright install --with-deps chromium`.

[Recorded verification on 31 October 2026](_docs/TASKS.md#k-cicd-verification)
includes **58 backend tests**, **six browser tests**, frontend type checking, lint,
production build, and Docker build. Coverage includes financial boundaries,
concurrency, rollback, restart persistence, backend errors, balance refresh,
filtered CSV downloads, and mobile navigation.

## Screenshots

Captured on 31 October 2026 using the real Spring Boot/H2 API and fresh demo data.

![Portfolio dashboard on desktop](_docs/previews/current/portfolio-desktop.png)

[Investment details](_docs/previews/current/investment-details-desktop.png) ·
[Withdrawal form](_docs/previews/current/withdrawal-desktop.png) ·
[Withdrawal history](_docs/previews/current/history-desktop.png) ·
[Mobile portfolio](_docs/previews/current/portfolio-mobile.png)

## Continuous integration and Render

[GitHub Actions](.github/workflows/ci.yml) checks pull requests and pushes to `main`,
and supports manual runs. Backend and frontend checks run in parallel, followed by
the browser suite. Successful `main` pushes also build the Docker image; Render is
configured to deploy after the checks pass. Failed checks block automatic deployment.
Failure reports are available as workflow artifacts for seven days.

The [Dockerfile](Dockerfile) packages the frontend export into Spring Boot so both
share one origin. [render.yaml](render.yaml) defines the demo service. See
[Docker setup](_docs/docker.md#build-and-run) for container startup and persistent storage.

## AI use

Rocket.new generated the initial frontend scaffold. I used **OpenAI Codex** to refine
the UI and assist with the Java backend, financial calculations, API integration,
tests, documentation, and CI/CD configuration. I provided the requirements and
design direction. Verification results and the remaining review of AI-assisted
code are recorded in the
[implementation checklist](_docs/TASKS.md#e-technical-and-delivery-guidelines).

Further documentation: [Specification](_docs/SPEC.md) ·
[Design system](_docs/design-system.md) · [Implementation checklist](_docs/TASKS.md).
