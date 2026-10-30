# Docker API integration tests

Run from the repository root:

```sh
make test-integration
```

The equivalent command without Make is `./scripts/test-integration.sh`. The README
is intentionally unchanged for this task.

## Prerequisites

- Java **21 JDK**, including `java` and `javac` on PATH. If set, `JAVA_HOME` must
  point to that JDK. The checked-in Maven Wrapper downloads Maven **3.9.16**.
- Docker Engine running, and Docker Compose **2.24.4 or newer**, with support for
  `!override` and `up --wait`.
- Bash, standard Unix tools, and network access for the initial image/dependency
  downloads. GNU Make is optional. Node/npm are provided by the Docker build.

## Workflow and isolation

The script merges `compose.yaml` with `compose.integration.yaml` and assigns a
unique `enviro365-it-*` project and image name. It builds the existing root
Dockerfile, including the real exported frontend and Spring Boot JAR. The existing
Docker build still runs the original backend tests. Production architecture,
Dockerfile and base Compose configuration are unchanged. The application fixes
discovered by this suite is described in the verification record below.

The test service replaces the development port with a dynamically allocated port
bound to **127.0.0.1**, and replaces the development volume with a read-only SQL
fixture. Its H2 files live on a **private RAM-backed tmpfs**, rather than any
developer database or persistent volume. Demo seeding is disabled; Hibernate creates
the schema, then Spring loads
`backend/src/test/resources/docker/seed.sql`. No database port, console, database
reset API, or extra service is exposed.

Compose waits for a successful portfolio API health check. Maven then compiles and
runs the separate JUnit **5.14.4** `*IT` classes through the Boot-managed Maven
Failsafe plugin **3.5.6**. The original suite already runs in the Docker build when
its inputs change; it is not repeated on the host. Tests use Java 21's `HttpClient` to
send real HTTP requests to the discovered application URL. Application scenarios
do not instantiate Spring, call services/repositories, or replace HTTP with mocks.

Before **every test invocation**, including parameterized cases and repetitions,
the test support invokes the **bundled H2 RunScript tool inside that container**
to delete previous fixture rows in foreign-key order and reload deterministic
records and notice IDs. The Spring Boot process stays running for the entire
suite. The test entrypoint extracts the existing H2 dependency from the unchanged
application JAR for this tool, then executes the normal `java -jar` application.
[H2 automatic mixed mode](https://h2database.com/html/features.html#auto_mixed_mode)
lets the tool connect to the same embedded database without stopping Spring;
its internal database port is never published to the host. This adds no service,
HTTP endpoint or dependency to the production application.

Guards verify the Compose project, image, exact test database URL and **tmpfs mount**
before permitting reset commands. `IFEXISTS=TRUE` prevents the reset tool from
silently creating a different database. A seed assertion through HTTP confirms
the expected financial state before each case. A failed scenario cannot contaminate
the next scenario. Tests run sequentially because they share this disposable
application; concurrency is explicitly controlled inside its scenario. API
readiness is polled with a deadline rather than a fixed startup delay.

Fixtures include fictional investors aged exactly **64, 65 and 66** using UTC
birthdays relative to the test date, fixed history timestamps, active and
inactive reservations, fractional balances, empty products, foreign ownership,
and a product name containing Unicode, a comma, quotes and a newline. The base
investor has R144,222.24 available across nine products, including R80,000 cash
and R60,000 retirement. No test requires manual database edits.

One **test-only SQL check constraint** rejects inserts for product 90. It forces a
real persistence failure through the normal production HTTP/service/transaction
stack. The test verifies HTTP 500, a generic safe message, unchanged history and
balances, and a subsequent successful request. This constraint is never installed
in a normal application database and introduces no additional notice statuses.

## Coverage

| Suite | Scenarios |
| --- | --- |
| `PortfolioIT` | Stored investor/products, initial available/reserved/max balances, sum of product balances, inactive history, empty investments |
| `WithdrawalIT` | HTTP 201, persisted notice observable through history, positive fractional amounts, SUBMITTED reservation semantics, refresh without double debit, zero/negative/below-minimum/over-precision/oversized/over-balance/over-cap errors, exact cap, down-rounding, R100 minimum, ages 64/65/66, rejected client overrides, cumulative cap on both product types |
| `WithdrawalIT` concurrency | Twelve HTTP clients reach a latch barrier before simultaneous release; exactly nine R100 reservations against a R1,000 product, three 422 rejections, unique IDs, matching history/reservation/balance totals; repeated with reset fixtures |
| `HistoryExportIT` | Independent expected fixture records, descending timestamps and ID tie-breaks, product/from/to/combined/same-day/no-match filters, inclusive UTC midnight and final microsecond boundaries, investor isolation, empty history |
| `HistoryExportIT` CSV | HTTP 200, UTF-8 `text/csv`, attachment filename, exact Date/Investment/Amount header, signed two-decimal amounts, correct dates/order/filters, CRLF rows, header-only empties, RFC4180 parser and Unicode/comma/quote/newline escaping |
| `ApiErrorsIT` | Missing/null/malformed/coerced fields and IDs, invalid filters on history and CSV, missing resources, ownership, 405/415/404, real database failure/rollback/recovery, safe JSON errors without database details or stack traces |

Every normal API response is checked against the **actual `openapi.yaml`** for
documented method/path/status/content type and the response schema vocabulary used
in this repository: references, allOf, required properties, object/array/string/
integer/number types, enums, numeric bounds, cent multiples and date/time formats.
This focused checker reads OpenAPI 3.2 directly; it is not a general-purpose validator
for arbitrary OpenAPI documents. CSV parsing uses test-scoped Apache Commons CSV
**1.14.1**, the stable release listed on the
[Apache download page](https://commons.apache.org/proper/commons-csv/download_csv.cgi).
Existing application dependency versions are preserved.

Methods run in shuffled order with a reproducible seed. To check another order:

```sh
IT_ORDER_SEED=366 make test-integration
```

The first workflow includes image and dependency downloads/builds. Subsequent
runs reuse Docker build layers. Only fixture data is reset between cases, avoiding
the previous cost of starting Spring Boot for every case. Do not run concurrent
Maven builds in the same working tree: Maven's
`backend/target` is shared. Ordinary `cd backend && ./mvnw test` and `./mvnw verify`
preserve the existing suite and do not run Docker tests. Invoking `-Pdocker-it`
without the managed script fails with setup guidance; it never silently skips.

## Results and cleanup

The script exits nonzero for a build, readiness, assertion or cleanup failure.
Failsafe prints per-class counts and assertion details. Results are available in:

- `build.log` in the run directory: original test suite results from the Docker build
  (or cached layers from an already verified build). `backend/target/surefire-reports/`
  contains XML/text reports when running the original suite separately with `./mvnw test`.
- `backend/target/failsafe-reports/`: latest Docker suite XML/text reports.
- `backend/target/docker-it/<project>/`: build/Maven/application logs, a copy of
  Failsafe reports (also on failure), and `project.txt` with the cleanup project name.

On success, failure, Ctrl+C, or termination, an exit trap captures application logs
and removes this run's containers, network, anonymous volumes and uniquely tagged
test image. Docker's reusable build cache and downloaded Maven dependencies remain.
Application data exists only in the discarded container's tmpfs. Developer containers,
images, H2 files and volumes are never targeted.

If the process is killed in a way that prevents shell cleanup, read `project.txt`
and run from the repository root, replacing the example with that exact project:

```sh
COMPOSE_PROJECT_NAME=enviro365-it-EXACT-PROJECT \
  docker compose -p enviro365-it-EXACT-PROJECT \
  -f compose.yaml -f compose.integration.yaml \
  down --volumes --remove-orphans --rmi all
```

Before cleanup, `docker compose` with the same project/files can run `ps` or
`logs app` to inspect a remaining service. No manual database cleanup is needed.
Remove saved reports with `make clean` when no Maven/test process is running.

## Verification record

Verified on **30 October 2026**, using Java 21, Docker Engine 29.7.2 and Compose
5.5.1. The complete `make test-integration` workflow built the existing application,
waited for the API, ran the suite and removed its container, network, temporary
database and uniquely tagged image.

| Suite | Passed | Failed | Errors | Skipped |
| --- | ---: | ---: | ---: | ---: |
| Docker API integration | 71 | 0 | 0 | 0 |
| Existing backend suite plus timestamp regression | 58 | 0 | 0 | 0 |
| Existing desktop/mobile browser regressions | 56 | 0 | 0 | 0 |

The Docker suite passed in **two complete runs**, with method-order seeds **365**
and **366**. The first run's four suites took **75.6 seconds** in total, excluding
image build, initial application startup and Maven compilation. The cached second
workflow took **105 seconds end to end**, including startup and cleanup. Application
logs confirm exactly **one Spring Boot startup per complete suite**.
The history/CSV suite fell from **302.9 seconds** with per-case JVM restarts to
**22.0 seconds** with private database resets, approximately **93% faster**. Assertions
and per-case fixture isolation are preserved. A first uncached build still takes
longer than a cached run.

Two application bugs were found and corrected, with the failing assertions retained:

1. **Creation/history timestamp mismatch.** `Clock.instant()` could return nanoseconds
   that H2's `TIMESTAMP(6)` could not retain. The POST response differed from the
   retrieved notice. Creation now normalizes to microseconds before persistence;
   a deterministic nanosecond-clock regression also passes against real H2.
2. **Unrelated validation messages.** Spring's method-validation exception included
   request-body errors, but the handler always returned an identifier/date message.
   It now returns the DTO field messages for nonpositive amounts, precision and
   missing fields, retaining HTTP 400 and unchanged financial state. No business
   rule, minimum, reservation model or cumulative cap was relaxed.

The stale retirement example in `SPEC.md` now correctly gives a zero next maximum
after reserving the entire cumulative cap. Workflow setup issues were also corrected:
ephemeral ports can change on container restart, and Docker records short-form tmpfs
mounts under `HostConfig.Tmpfs`. The final workflow needs only one application startup
and validates the private database configuration before any reset.

The contract checker covers this document's schema vocabulary, rather than all
possible OpenAPI extensions. A standalone lock-timeout **409** was not forced;
the repeated contention cases verify deterministic success/422 outcomes and
reservation consistency. File-backed restart persistence remains covered by the
existing `FilePersistenceTest`. Production deployment and bank payments are outside
this suite's scope.
