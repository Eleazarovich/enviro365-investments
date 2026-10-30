# Enviro365 Investments — Implementation & QA Checklist

Backend and live integration verified on 29 October 2026 with Java 21, Spring Boot,
real H2, JUnit 5/Mockito and desktop/mobile Playwright. See the
[backend verification report](backend-verification.md) and earlier
[frontend report](frontend-verification.md). Remote publishing remains outside
automated verification.

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
- [x] Dashboard displays investor portfolio data from the selected adapter.
- [x] Investment products are displayed.
- [x] Overall available balance is accurate in the verified mock and HTTP fixtures.
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
policy. Backend/H2, mock and browser checks verify it. See [business rules](business-rules.md).

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

## F. Docker API integration verification

Verified on 30 October 2026. Run `make test-integration`; see the
[Docker integration test guide](docker-integration-tests.md) for prerequisites,
isolation, reports, cleanup and the verification record. README changes are deferred
at the user's request.

- [x] Test the actual application built and started with the existing Docker configuration.
- [x] Separate JUnit 5 HTTP integration tests from the original backend tests.
- [x] Reset deterministic fixture data between cases in a private RAM-backed H2 database.
- [x] Verify portfolio retrieval, reservation creation, amount/age boundaries, cumulative caps and concurrent requests.
- [x] Verify history, inclusive UTC filters, parseable filtered CSV, OpenAPI response contracts and safe errors.
- [x] Verify real database failure rollback and subsequent successful requests without a reset API.
- [x] Use readiness checks and clean up containers, networks, temporary data and the unique test image.
- [x] Pass all 71 Docker API tests, 58 backend tests and 56 existing browser regression tests.
- [x] Repeat all 71 Docker tests with another shuffled order; cached workflow completes in 105 seconds.
- [x] Correct creation/history timestamp precision and misleading request-body validation messages.

## G. Docker browser end-to-end verification

Verified on 30 October 2026. Run `make test-e2e-docker`; see
[`e2e/testing.md`](../e2e/testing.md) for setup, fixtures, reports and limitations.
README changes remain deferred at the user's request.

- [x] Use TypeScript Playwright tests in root `e2e/` against the real Compose application, Spring Boot and H2.
- [x] Verify portfolio totals/cards, investment details and back navigation.
- [x] Submit a fractional withdrawal; verify backend balances, reservations, cumulative cap, history and page refresh persistence.
- [x] Reject zero, negative, below-minimum, over-cap and over-balance amounts without changing backend state.
- [x] Display a real backend 422 when another client reserves the available cap after the form opens.
- [x] Verify isolated retirement investors aged 64 and exactly 65, with no age input or product changes.
- [x] Verify exact history records, product and inclusive date filters, and cleared selections.
- [x] Capture and read CSV downloads for product, date and combined filters; verify headers, dates, names, signed cents and exact records.
- [x] Complete a withdrawal and portfolio/history navigation in mobile Chromium.
- [x] Reset private H2 fixtures before every test; use accessible selectors and observable readiness instead of fixed sleeps.
- [x] Capture failure screenshots, traces and browser/application logs; verify both successful and failing workflows clean up Docker resources.
- [x] Pass all 15 Docker browser tests with zero failures or skips; pass standalone E2E TypeScript checks.
- [x] Preserve all 56 existing desktop/mobile frontend browser regressions.
