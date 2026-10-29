# Backend and live integration verification

Verified locally on **29 October 2026** in
`/home/eleazarai/projects/enviro365-investments` (the supplied `enviro365` path was
absent). Existing unrelated frontend edits were retained.

## Implemented behavior

- Java 21, Spring Boot 4.1.2, Spring Web MVC, Spring Data JPA, Jakarta Validation,
  H2 and Maven Wrapper 3.9.16 under `backend/`.
- Investor → portfolio → products → notices persisted through JPA relationships.
  File-backed H2 is the default; test databases are isolated.
- All four agreed operations, without authentication: portfolio, withdrawal creation,
  history and CSV. Existing frontend endpoint paths and DTO shapes are preserved.
- `BigDecimal` arithmetic with separate underlying balances and active reservations.
  The latest user request's cumulative 90% cap supersedes the earlier per-request policy.
  The R100 minimum is retained. Documentation, mock calculations and UI rule text agree.
- Transactional creation with a pessimistic product row lock and `READ_COMMITTED`.
  A notice is its reservation, avoiding a second stored counter. No bank payments.
- Bean Validation, service validation, consistent JSON errors and configurable CORS.
- HTTP is now the frontend's default; the mock is an explicit opt-in.

## Checks executed

| Command / check | Result |
| --- | --- |
| `backend/./mvnw clean verify` | **57 tests passed**, zero failures/errors/skips; executable JAR built |
| `frontend/npm run type-check` | Passed |
| `frontend/npm run lint` | Passed; six existing warnings in `AppIcon.tsx` / `AppImage.tsx` |
| `frontend/npm run build` | Passed; all seven static pages generated |
| `frontend/npm run test:e2e` | 54 passed initially; two recovery assertions retained the old numerical maximum |
| `npx playwright test --grep 'a failed balance refresh'` | Both affected desktop/mobile checks passed after correcting R71,100 to R69,000; **all 56 cases now verified** |
| `npx playwright test --config=playwright.live.config.ts` | **4 passed** against real Spring Boot/H2 on desktop and mobile |
| OpenAPI parse/reference check | OpenAPI 3.2.1 parsed using existing `js-yaml`; 4 operations and 41 local references resolved |
| Packaged JAR | Started on 8080 using default file H2; portfolio, filtered CSV and missing-investor JSON 404 checked with actual HTTP calls |
| `git diff --check` | Passed |

Builds skip frontend type and lint checks by existing Next.js configuration, so their
separate commands were run. No frontend dependency upgrade was introduced.

## Backend test evidence

The six test classes exercise:

- Portfolio DTO contents, totals, reservations and missing-investor errors.
- Positive/fractional requests, persisted records, balance refresh and unchanged
  underlying balance; zero, negative, below-minimum, excessive-precision, excessive
  available-balance and cumulative-cap rejections.
- Retirement ages 64/65/66, the 66th birthday and the day before it.
- Repeated notices sharing one cap. The cash demo can reserve another R70,000,
  retaining R10,000 available and returning a zero further maximum.
- Rollback after an actual notice insert, proving both history and reservation totals
  revert together. Failed HTTP requests leave database totals unchanged.
- Ten independent simultaneous transactions on a R1,000 product requesting R100 each:
  **nine succeed, one is rejected, R900 is reserved and R100 remains**.
- Product ownership and investor scoping; AND filters, inclusive UTC midnight/end-of-day
  bounds, newest-first history, no matches and invalid filters.
- Exact CSV headers, signed decimal amounts, CRLF separators, quote/comma/newline
  escaping, filenames and header-only empty exports.
- JSON errors, strict numeric types, hidden persistence fields, safe unexpected errors,
  configured CORS preflight and exposure of the CSV filename.
- Idempotent seeding and a real file-H2 application restart retaining the submitted
  notice, reservation and refreshed portfolio.

JUnit Jupiter **5.14.4** is used. Because Spring 7.0.10's `SpringExtension` calls a
JUnit 6 API, integration tests bootstrap actual Boot contexts explicitly and bind
MockMvc to the web application context. Spring repositories, advice, validation,
transactions and H2 remain real. Mockito supports isolated response/error tests.

## Live browser evidence

The live suite starts Java/H2 on **8081** and Next.js on **4030**, without intercepted
API responses. On desktop and mobile it opens the portfolio, enters an invalid minimum,
submits R1,500.75 through the existing form, verifies HTTP 201, checks stored history and
available funds, reloads the page, confirms a rejected request changes no records, filters
cash history to 30 September, and downloads the exact CSV including the browser-added BOM.

A separate client reserves retirement's remaining cap after a dialog has loaded. The
form's now-stale R100 request receives a real backend 422 and displays its message.
The following mobile check confirms that exhausted cap remains disabled after navigation.

## Remaining scope

No requested backend functionality is pending. Authentication, account management,
payment execution, reservation settlement/cancellation and production infrastructure
are intentionally outside scope. The eight inactive historical reservations are imported
demo records already reflected in underlying balances, not payments executed here.

Existing screenshots show the previous frontend phase and numerical limits. Six existing
frontend lint warnings remain. The developer still needs to review/explain the AI-assisted
implementation. Local commits had not been published at the time of this report.
