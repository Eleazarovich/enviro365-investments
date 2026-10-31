# Enviro365 Investments — Implementation & QA Checklist

The simplified workflow was verified on 30 October 2026: **58 backend tests** and
**six real-backend Playwright tests** passed, along with frontend types, lint and
production build. The older [backend report](backend-verification.md) and
[frontend report](frontend-verification.md) are historical records. Remote publishing
remains outside this verification.

## A. Mandatory backend requirements

### MB-01 — Retrieve investor portfolio
- [x] Spring Boot exposes an endpoint to retrieve an investor's portfolio.
- [x] The response includes investor details and investment products.
- [x] Each product has the correct available balance.
- [x] The API handles an investor that does not exist.

**Verify:** Call the API directly and compare its response with the H2 database records.

### MB-02 — Create withdrawal notices
- [x] API accepts a withdrawal request.
- [x] The backend validates the applicable business rules.
- [x] Valid requests create a persisted withdrawal notice.
- [x] Balance calculations remain correct after submission.
- [x] Invalid requests leave the stored data unchanged.

**Verify:** Submit valid and invalid requests through both the UI and API.

### MB-03 — Export filtered CSV statements
- [x] Spring Boot produces a CSV file.
- [x] The export supports filtering.
- [x] Product and date filters work as specified.
- [x] CSV content matches the selected records.
- [x] File headers and monetary values are correct.

**Verify:** Download the CSV, open it, and compare it with the withdrawal history.

## B. Mandatory frontend requirements

### MF-01 — Portfolio dashboard
- [x] Dashboard displays investor portfolio data from the real HTTP adapter.
- [x] Investment products are displayed.
- [x] Overall available balance is accurate against the real backend.
- [x] Investor can open individual investment details.
- [x] Data is retrieved from the Spring Boot API in the integrated version.

### MF-02 — Withdrawal form
- [x] User can enter a withdrawal amount.
- [x] User can submit a request through the selected adapter.
- [x] User receives clear feedback for invalid requests.
- [x] Successful submission refreshes the displayed balance; a failed refresh shows retry instead of outdated figures and does not resubmit the withdrawal.
- [x] Request is sent to the actual backend API.

### MF-03 — Withdrawal history table
- [x] History displays withdrawal records returned by the selected adapter.
- [x] Lists show Date, Investment and signed Amount; investment-specific lists omit Investment. Notice status remains internal.
- [x] Newly submitted requests appear in the history.
- [x] Empty states are handled.

### MF-04 — CSV download button
- [x] Download button exists above the filters.
- [x] Button calls the backend export API.
- [x] Product and date filters are respected; superseded responses cannot change current results or enable an outdated download.
- [x] Browser downloads a valid CSV file with Date, Investment and negative Amount columns.

## C. Mandatory business rules

### BR-01 — Retirement age
- [x] Retirement withdrawal is rejected when investor age is 65.
- [x] Retirement withdrawal is rejected when investor age is below 65.
- [x] Retirement withdrawal is eligible when investor age is greater than 65, assuming other rules pass.

### BR-02 — Available balance
- [x] Withdrawal exceeding the available balance is rejected.
- [x] Failed requests do not alter the available balance.

### BR-03 — 90% withdrawal restriction
- [x] Withdrawal above the applicable 90% limit is rejected.
- [x] Withdrawal at exactly the permitted maximum is accepted, assuming other rules pass.

**Current policy:** Active submitted notices share a cumulative cap of 90% of the
underlying balance per product, rounded down to cents. Retain the R100 minimum and
return a maximum of R0 when no request fits, keeping the actual balance visible.
This follows the latest backend instructions and supersedes the earlier frontend
policy. Backend/H2 and browser checks verify it. See [business rules](business-rules.md).

### BR-04 — Error handling and user feedback
- [x] Invalid requests produce meaningful API errors.
- [x] Frontend displays clear and helpful error messages.
- [x] Failed requests do not appear as successful.

## D. Advanced requirements

### ADV-01 — Global exception handling
- [x] Centralized Spring Boot exception handler exists.
- [x] Business-rule failures return appropriate HTTP errors.
- [x] Missing resources and unexpected errors are handled.
- [x] Internal stack traces are not exposed to users.

### ADV-02 — DTO layer
- [x] API request DTOs exist.
- [x] API response DTOs exist.
- [x] Database entities are not returned directly from controllers.
- [x] Mapping between entities and DTOs is understandable.

### ADV-03 — Input validation
- [x] Required inputs are validated.
- [x] Missing, negative and invalid amounts are rejected.
- [x] Malformed requests return meaningful responses.
- [x] Server-side validation cannot be bypassed by manipulating the UI.

### ADV-04 — Unit tests
- [x] Business-rule tests exist.
- [x] Age boundary tests pass.
- [x] Balance-limit tests pass.
- [x] 90% limit tests pass.
- [x] Valid withdrawal tests pass.
- [x] Invalid withdrawal tests pass.

### ADV-05 — UI validation
- [x] Form validates user input.
- [x] Error messages appear near the relevant input.
- [x] Invalid submissions are prevented where possible.
- [x] Backend errors are also displayed correctly.
- [x] Submitting state prevents duplicate clicks.

HTTP error feedback and retry are verified with fixtures and with a real 422 rejection
from the live Spring Boot backend after another client reserves the available limit.

## E. Technical and delivery guidelines

- [x] Backend uses Spring Boot.
- [x] Database uses H2.
- [x] Java package follows `com.enviro.assessment.junior.yourname`.
- [x] APIs follow REST best practices.
- [x] Frontend communicates with actual backend APIs.
- [x] GitHub repository includes backend and frontend.
- [x] README includes frontend setup, verified with a clean `npm ci` installation.
- [x] README includes API documentation.
- [ ] README includes current frontend screenshots.
- [x] README discloses AI tool usage.
- [ ] Review and understand all AI-assisted code.
- [x] Application can be started and tested using README instructions.

## F. Backend test simplification

The duplicate Docker HTTP suite, custom OpenAPI validator, container inspections,
external SQL resets and Maven Failsafe profile have been retired. Standard backend
JUnit/MockMvc/H2 tests directly assert the required API responses and financial rules.
`openapi.yaml` remains the API documentation. Run `make test` or `./mvnw clean verify`
from `backend/`.

## G. Browser test consolidation

The earlier Docker browser suite and frontend fixture/live suites are replaced by
one six-test Playwright suite. All six passed on 30 October 2026, along with
frontend types, lint and production build. Run `make test-e2e`; see the root README.
Backend tests retain age boundaries, precision, cumulative caps, concurrent writes,
rollback, filtering, CSV and restart persistence coverage.

## H. Managed backend test stack

JUnit Jupiter uses Spring Boot 4.1.2's managed version (6.0.3). Integration and seed
tests use standard Spring annotations; manual context startup is reserved for the
restart-persistence test.

## I. One source for financial calculations

The frontend always uses `httpApi`. Mock services, browser state, failure switches
and the mock-mode environment flag have been removed. Spring Boot owns the rules
and H2 owns stored notices. UI validation uses limits returned by the backend.

## J. Financial rules and design

- [x] Document the R100 minimum, cumulative cap and reservation calculations.
- [x] Document the controller/service/repository flow and why a product lock is used.
- [x] Retain the agreed financial behaviour and worked monetary examples.

See [business rules](business-rules.md). The implementation still supplies all five
advanced options: exception handling, DTOs, input validation, unit tests and UI validation.

## K. CI/CD verification

Local verification on 31 October 2026 (Ubuntu 24.04, Java 21, Node 24):

- [x] Existing coverage reviewed against mandatory requirements and all five advanced options; financial assumptions retained.
- [x] `./mvnw -B -ntp clean verify`: 58 backend tests passed, none skipped; executable JAR packaged.
- [x] `npm ci`, `npm run type-check`, `npm run lint`, `npm run build` passed.
- [x] `CI=true npm run test:e2e`: six real Spring Boot/H2 browser tests passed; HTML report generated.
- [x] Existing multi-stage `docker build --progress=plain --tag enviro365:ci .` passed, including its tests.
- [x] GitHub Actions workflow validated with actionlint 1.7.12; referenced official action tags resolve.
- [x] `render blueprints validate render.yaml --output json` returned `valid: true`.
- [x] README documents job coverage, local commands, failure artifacts, and GitHub/Render settings.
- [x] Pipeline names describe this project's checks; backend and frontend start together, browser tests require both, and the demo image requires passing browser tests. Validated with actionlint 1.7.12.
- [x] GitHub environment `demo` created; README includes the live demo link and explains deployment status.
- [x] Live Render service set to `autoDeployTrigger: checksPass`, confirmed through the API on 31 October 2026.
- [x] Hosted main run `41186360558` for `97fde28` passed all four named jobs: 58 backend tests, six browser tests, frontend checks and Docker. Timestamps confirm the parallel first stage and ordered later stages.
- [x] Render published `97fde28` after all checks passed; the live frontend and portfolio API responded successfully. GitHub's green `demo` deployment records the same SHA and links to the app.
- [ ] Confirm hosted PR runs, failure artifact upload and required PR checks.
- [ ] Verify deliberately failed main checks leave the previous Render release live.

`render.yaml` and the live Render service now use `checksPass`. For `97fde28`, the
last GitHub check finished at **08:57:51 UTC** and Render deployment
`dep-dbiqr4navr4c73bc9k3g` started at **08:57:54 UTC**. Render waited for all four
checks before deploying the same SHA. It became **live at 09:00:33 UTC** and both
the website and portfolio API passed read-only smoke checks. GitHub deployment
`7456586491` records that release under
`demo`. A deliberately failing main deployment and hosted PR failure artifacts have
not been tested. Future Render releases require a verified GitHub deployment entry
to refresh the sidebar status; the native integration does not synchronize it.
There is no scheduled workflow. Local system-dependency
installation required an unavailable sudo password; Chromium installation and the
browser suite passed using existing libraries. CI retains `--with-deps` on GitHub's
hosted runner. See the root [README](../README.md#continuous-integration-and-render).
