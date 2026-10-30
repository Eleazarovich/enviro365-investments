# Full-stack Playwright tests

Run from the repository root. README changes are deferred at the user's request.

## Setup and run

Required: Docker Engine running, Docker Compose **2.24.4+** (`!override` support),
Node.js **24**, npm, Bash, and optional GNU Make. Java/Maven run inside the existing
Docker build. Initial setup needs network access for packages, Chromium and images.

```sh
npm --prefix e2e ci
npm --prefix e2e run install:browser
make test-e2e-docker
```

On Linux systems missing browser libraries, install them once with
`cd e2e && npx playwright install --with-deps chromium`.
Playwright **1.64.1**, TypeScript **5.9.3** and Node types **20.19.43** match the
existing frontend's resolved versions and are pinned in a separate lockfile.
Browser tooling stays outside the production image.

Without Make, `npm --prefix e2e test` runs the same full workflow after setup.
For a focused run, pass Playwright options to the script:

```sh
./e2e/run.sh --project=chromium --grep 'stale form'
```

`make test-e2e` continues to run the existing frontend regression suite.
`make test-integration` continues to run the existing Docker API integration suite.
The new `make test-e2e-docker` command runs actual browser journeys against Docker.

## Docker workflow and fixtures

`run.sh` merges the root `compose.yaml`, existing `compose.integration.yaml`, and
`e2e/compose.yaml`. It builds the existing Dockerfile: exported Next.js pages and
the real Spring Boot application share one service and URL. The test overlay
replaces only the mounted SQL fixture. Application source, production deployment
architecture and business rules are unchanged.

Every invocation assigns a unique `enviro365-e2e-*` Compose project and image,
with a dynamically assigned **127.0.0.1** port. Compose waits for its API health
check; the runner then polls both portfolio JSON and the exported frontend with
deadlines before starting Playwright. The discovered port becomes Playwright's
base URL. Browser API calls use the production HTTP adapter and the same origin;
there are no routes, intercepted responses or mock APIs in this suite.

The existing test overlay stores H2 files in a private container **tmpfs** and
disables demo seeding. It never mounts the development H2 volume. Before every
test, the fixture verifies the project/image, database URL, tmpfs and read-only
seed mount, then invokes H2's bundled RunScript tool inside the container to load
`seed.sql`. `IFEXISTS=TRUE` prevents creating a different database by mistake.
No test endpoint, age form input, database port or production dependency is added.

The fixture contains investor **1**, aged **68**, Cash Investment (R100,000
underlying, R20,000 reserved) and Retirement Investment (R60,000 underlying).
Expected available balances are R80,000 and R60,000, totaling R140,000. Independent
test expectations in `support/data.ts` use integer cents for balance, reservation
and cumulative 90% cap calculations and verify the initial API state each time.

Eight fixed historical records cover both products, cents, UTC midnight, the
last microsecond of September, and dates outside the filter range. Only the
R20,000 notice is an active reservation. Retirement tests set this private
investor's birthday relative to the container's UTC date, giving exact ages **64**
and **65** without changing the application or letting investors edit their age.

Tests run sequentially with **one worker**, fresh browser contexts and a database
reset per test. Do not override the worker count: these cases deliberately share
one disposable database. Separate complete script invocations have separate
projects, databases and report directories. No test depends on a previous test
or retries to succeed. Playwright assertions wait for observable UI state;
there are no fixed browser sleep delays.

## Scenarios

| Scenario | Checks |
| --- | --- |
| Portfolio | Dashboard, available total, both cards, correct detail name/balance, back navigation |
| Withdrawal | R1,500.75 submission, HTTP 201 and SUBMITTED notice, success confirmation, exact backend balance/reservation/cap changes, history, page refresh persistence |
| Invalid amounts | Zero, negative edits, R99.99, over-cap and over-balance inputs; clear UI feedback, real backend rejection, unchanged portfolio and history |
| Stale balance | A real second client reserves the cap after the form opens; browser submission gets HTTP 422, preserves amount, displays server error, creates no extra notice |
| Retirement | Ages 64 and exactly 65 blocked by UI and rejected by the backend, unchanged balance/history, no age input |
| History | Exact records/order, product filter, inclusive September dates, combined filters, cleared selection restores full history |
| CSV | Product, date and combined filters; capture/save/read the browser download, filename, MIME type, BOM, headers, CRLF records, dates, names, signed two-decimal deductions, exact record set and order |
| Mobile Chromium | Pixel 7 viewport, portfolio/detail navigation, readable balance, R123.45 retirement submission, backend state, mobile history, no horizontal overflow |

CSV checks use an explicit three-column record grammar for the seeded product
names and independently compare every record with fixture expectations and the
real history response. The browser file must also match the backend export body,
apart from the UI's UTF-8 BOM. They do not just assert that a button was clicked.

Amounts remain positive in API notices and negative in UI/CSV deductions. A
SUBMITTED notice reserves funds; it does not assert that a bank transfer completed.
Refresh persistence covers the running test environment. Container restart/file
durability remains covered by the existing backend `FilePersistenceTest`.
Coverage is Chromium plus one mobile smoke test; it is not a visual regression
or multi-browser suite.

## Reports and cleanup

Each invocation prints its `e2e/reports/<project>/` directory, containing:

- `playwright-report/index.html`: HTML report with attachments.
- `results.xml`: JUnit XML for CI.
- `test-results/`: failed-test screenshots and traces, plus saved CSV downloads.
- `playwright.log`: assertion results and stack traces.
- `application.log`, `build.log`, `containers.txt`, `project.txt`: application
  logs, build output, container status before cleanup and exact project name.

Failed tests also attach browser console/request failures and a tail of the
application log directly to the Playwright report. Traces are retained on failure
without requiring a retry. View them using the installed runner:

```sh
cd e2e
npx playwright show-report reports/EXACT-PROJECT/playwright-report
npx playwright show-trace reports/EXACT-PROJECT/test-results/EXACT-TEST/trace.zip
```

The script returns nonzero for build, readiness, type-check, test or cleanup
failure. Exit traps save logs and remove the test container, network, volumes,
unique image tag and temporary run directory on success, failure, Ctrl+C or
termination. Reports and reusable Docker build cache remain. Developer data and
other Compose projects are untouched.

If a forced kill prevents the trap from running, read the project's `project.txt`
and run from the repository root using that exact project name:

```sh
COMPOSE_PROJECT_NAME=enviro365-e2e-EXACTID \
  docker compose -p enviro365-e2e-EXACTID \
  -f compose.yaml -f compose.integration.yaml -f e2e/compose.yaml \
  down --volumes --remove-orphans --rmi all
```

Reference: Playwright's official documentation for
[fixtures](https://playwright.dev/docs/test-fixtures),
[configuration](https://playwright.dev/docs/test-configuration), and
[downloads](https://playwright.dev/docs/downloads).

## Verification record

Verified on **30 October 2026**, using Node 24.15.0, Docker Engine 29.7.2 and
Compose 5.5.1. `make test-e2e-docker` built and started the full stack, waited for
readiness, and passed **15 tests, 0 failures, 0 skips** (14 desktop Chromium and
one mobile Chromium). Browser execution took **89.6 seconds**, excluding image
build and initial startup. Type checking and shell syntax checks also passed.
The existing frontend browser regression command, `cd frontend && npm run test:e2e`,
also passed **56 tests, 0 failures** in desktop and mobile projects.

A temporary, deliberately failing browser test separately verified the failure
workflow: a nonzero exit, valid PNG screenshot, readable trace ZIP, browser and
Spring Boot log attachments, HTML/JUnit reports, and automatic cleanup. That probe
was then removed; its expected failure is not part of the 15-test application
suite. Docker inspection confirmed no remaining container, network, volume or
image tag for the failed run. The successful run also completed automatic cleanup.

No application bugs were discovered, and no application code, business rule or
README was changed. Initial application build checks reused verified Docker cache
layers where available; they are not claimed as separate fresh backend test runs.
