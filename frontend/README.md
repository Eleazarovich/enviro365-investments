# Enviro365 Investments — Frontend

Next.js 15.5.28 App Router, React 19.0.9, TypeScript, Tailwind CSS, and Lucide.
The interface provides portfolio balances, investment details, withdrawal
submission, filtered history, and CSV downloads through the Spring Boot API.

## Setup

Requires **Node.js 24/npm** and the backend running on port **8080**.
From `frontend/`:

```sh
npm ci
test -f .env.local || cp .env.example .env.local
npm run dev
```

Open `http://localhost:4028`. Configure the backend origin in `.env.local`:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

Omit a trailing slash and `/api`. Restart Next.js after changing the value;
production exports require a rebuild. Public environment variables are visible
in the browser and must not contain secrets.

## Implementation

| Location | Responsibility |
| --- | --- |
| `src/app/` | Portfolio, investment details, and withdrawal history screens |
| `src/components/` | Shared navigation, tables, dialogs, and controls |
| `src/lib/api/` | HTTP adapter, endpoints, filters, and API errors |
| `src/lib/types.ts` | Shared request and response contracts |
| `src/lib/PortfolioProvider.tsx` | Portfolio state and balance refresh |
| `src/styles/` | Rosewood & Porcelain design tokens and styles |

The UI validates amounts against backend-provided limits and displays server
errors. Successful submissions refresh balances and history. History and CSV use
the same filters. Amounts use rand with cents; dialogs support keyboard navigation
and focus management.

## Checks

```sh
npm run type-check
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright requires **Java 21** and starts disposable Spring Boot/H2 on **8081**
and Next.js on **4029**. Six tests cover portfolio loading, valid and invalid
withdrawals, balance/history refresh, backend rejection, filtered CSV downloads,
and mobile navigation. Local H2 data is unaffected. Linux may require
`npx playwright install --with-deps chromium` for browser system libraries.

The production build writes a static export to `out/`; the root Dockerfile
packages it into Spring Boot.

[Project README](../README.md) contains requirements coverage, architecture,
screenshots, and the AI-use disclosure.
