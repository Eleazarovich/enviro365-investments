# Enviro365 Investments

Investor portfolio, withdrawal notices, history, and filtered CSV statements.
The Next.js frontend currently runs against an in-memory mock adapter. The Java
Spring Boot/H2 backend has not yet been implemented; mock notices are not persisted
across a full browser reload.

## Run the frontend

With Node.js and npm installed, run:

```sh
cd frontend
npm ci
npm run dev
```

Open http://localhost:4028. Mock mode is enabled unless
`NEXT_PUBLIC_USE_MOCK_API=false` is set. To connect the future backend, configure
`NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_USE_MOCK_API=false` in
`frontend/.env.local`. Do not place secrets in public environment variables.

The committed `frontend/package-lock.json` pins the existing dependency versions
for `npm ci`. A clean installation, type check, lint and build have been verified.

## Withdrawal rules

Both products allow up to 90% of the **remaining available balance per request**,
rounded down to cents, with a **R100 minimum**. Recalculate after every accepted
request. If the percentage maximum is below R100, disable withdrawals and keep
the remaining balance visible. There is no final-balance exception. Retirement
withdrawals additionally require age greater than 65.

See the [confirmed business rules](_docs/business-rules.md) for examples and
withdrawal calculations.

## Proposed backend API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/investors/{investorId}/portfolio` | Investor and products, including `availableBalance`, `minimumWithdrawable`, and `maximumWithdrawable` |
| POST | `/api/investors/{investorId}/withdrawal-notices` | Create a notice using `{ "productId": 1, "amount": 1500.75 }` |
| GET | `/api/investors/{investorId}/withdrawal-notices` | History with optional `productId`, `fromDate`, and `toDate` filters |
| GET | `/api/investors/{investorId}/withdrawal-notices/export` | CSV using the same filters |

These endpoints have a frontend HTTP adapter but no running backend yet. Monetary
API amounts are positive; history and CSV display withdrawals as negative deductions.
See the [specification](_docs/SPEC.md) for the full contract and implementation scope.

## Verification

Run from `frontend/`:

```sh
npm run type-check
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright uses port 4029 and `.next-e2e`. It tests the browser with HTTP fixtures
and tests the real mock adapter directly. It does not prove Spring Boot/H2 integration.

See the [frontend verification report](_docs/frontend-verification.md) for the
completed frontend requirements, regression checks and remaining lint warnings.

## Design previews and AI use

[Desktop portfolio](_docs/previews/rosewood-porcelain/portfolio-desktop.png) ·
[Mobile portfolio](_docs/previews/rosewood-porcelain/portfolio-mobile.png) ·
[Design system and other previews](_docs/design-system.md)

OpenAI Codex assisted with frontend code, mock financial calculations, tests, and
documentation. The repository records implementation assumptions and verification
so the developer can review and explain the AI-assisted work.
