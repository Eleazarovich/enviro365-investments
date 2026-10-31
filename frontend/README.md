# Enviro365 Investments — Frontend

Responsive investor interface for portfolios, investment details, withdrawal
submission, history, and CSV downloads. Built with **Next.js 15.5.28 App Router**,
**React 19.0.9**, **TypeScript**, **Tailwind CSS**, and **Lucide** icons.

[Project overview](../README.md) · [Backend setup](../backend/README.md) ·
[Design system](../_docs/design-system.md)

## Run locally

Install **Node.js 24 with npm** and start the [Java backend](../backend/README.md#run-locally)
on port **8080**. From `frontend/`:

```sh
npm ci
test -f .env.local || cp .env.example .env.local
npm run dev
```

Open [http://localhost:4028](http://localhost:4028). Existing `.env.local` settings
are preserved. Alternatively, run `make run` from
the repository root to configure and start both applications.

### API configuration

Set the backend origin in `.env.local`, without a trailing slash or `/api`:

```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

Restart the development server after changing it. `NEXT_PUBLIC_*` values are
included in the browser bundle and must not contain secrets. Production builds
compile these values into the static export; the Docker build uses an empty base
URL for same-origin `/api` requests.

The frontend always calls Spring Boot for investor **1**. H2 stores the records;
financial eligibility and limits come from the backend. If requests fail, confirm
the backend is running and its `CORS_ALLOWED_ORIGINS` includes the frontend origin.

## Screens and behaviour

| Route | Purpose |
| --- | --- |
| `/` | Portfolio balance and investment cards |
| `/investment-detail?id=1` | Investment details, withdrawal form, and investment history |
| `/withdrawal-history` | History, investment/date filters, and **Download statement** |

Amounts use South African rand and preserve cents. Entry groups thousands, allows
two decimal places, and completes cents on blur. Form validation uses API-provided
limits and also displays backend errors. Successful submissions refresh balances
and history; a failed balance refresh offers retry without resubmitting the notice.
History and CSV use the same filters and show signed deductions.

The **Rosewood & Porcelain** design uses Geist typography, shared controls, visible
keyboard focus, and managed dialog focus. See the
[screenshots](../README.md#screenshots) and [design system](../_docs/design-system.md).

## Source layout

| Location | Responsibility |
| --- | --- |
| `src/app/` | App Router pages and screen-specific components |
| `src/components/` | Shared navigation, tables, and UI controls |
| `src/lib/api/` | HTTP adapter, endpoints, filters, and API errors |
| `src/lib/types.ts` | Shared API data contracts |
| `src/lib/PortfolioProvider.tsx` | Portfolio state and refresh coordination |
| `src/styles/` | Design tokens and global/Tailwind styles |
| `tests/e2e/` | Real-backend desktop and mobile browser tests |

Visual components import `api` from `src/lib/api/index.ts`; endpoint construction
and HTTP handling stay in the API layer. Business calculations remain in Java.

## Checks

From `frontend/` after `npm ci`:

```sh
npm run type-check
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright requires **Java 21** and starts Spring Boot/H2 on **8081** and Next.js on
**4029**, using `.next-e2e`. Keep both ports free. Six tests cover portfolio loading,
valid and invalid withdrawals, refreshed balances/history, filtered CSV downloads,
real backend rejection, and mobile navigation. Each run uses fresh in-memory H2;
local development data is untouched. On Linux, Chromium also needs system libraries;
`npx playwright install --with-deps chromium` installs them where permitted.

`npm run build` creates a static export in `out/`. The root Dockerfile packages it
into Spring Boot for deployment. See [Docker setup](../_docs/docker.md#build-and-run).

## AI use

Rocket.new generated the initial frontend scaffold. OpenAI Codex assisted with UI
refinement, reusable components, validation, API integration, browser tests, and
documentation. See the [project AI disclosure](../README.md#ai-use) for review status.
