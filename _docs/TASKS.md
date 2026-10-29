# Enviro365 Investments — Implementation & QA Checklist

Frontend verification on 29 October 2026 uses the real mock adapter and intercepted
HTTP responses. Checked frontend items below cover that phase; live integration and
backend requirements remain unchecked. See the [frontend report](frontend-verification.md).

## A. Mandatory backend requirements

### MB-01 — Retrieve investor portfolio
- [ ] Spring Boot exposes an endpoint to retrieve an investor's portfolio.
- [ ] The response includes investor details and investment products.
- [ ] Each product has the correct available balance.
- [ ] The API handles an investor that does not exist.

**Verify:** Call the API directly and compare its response with the H2 database records.

### MB-02 — Create withdrawal notices
- [ ] API accepts a withdrawal request.
- [ ] The backend validates the applicable business rules.
- [ ] Valid requests create a persisted withdrawal notice.
- [ ] Balance calculations remain correct after submission.
- [ ] Invalid requests leave the stored data unchanged.

**Verify:** Submit valid and invalid requests through both the UI and API.

### MB-03 — Export filtered CSV statements
- [ ] Spring Boot produces a CSV file.
- [ ] The export supports filtering.
- [ ] Product and date filters work as specified.
- [ ] CSV content matches the selected records.
- [ ] File headers and monetary values are correct.

**Verify:** Download the CSV, open it, and compare it with the withdrawal history.

## B. Mandatory frontend requirements

### MF-01 — Portfolio dashboard
- [x] Dashboard displays investor portfolio data from the selected adapter.
- [x] Investment products are displayed.
- [x] Overall available balance is accurate in the verified mock and HTTP fixtures.
- [x] Investor can open individual investment details.
- [ ] Data is retrieved from the Spring Boot API in the integrated version.

### MF-02 — Withdrawal form
- [x] User can enter a withdrawal amount.
- [x] User can submit a request through the selected adapter.
- [x] User receives clear feedback for invalid requests.
- [x] Successful submission refreshes the displayed balance; a failed refresh shows retry instead of outdated figures and does not resubmit the withdrawal.
- [ ] Request is sent to the actual backend API.

### MF-03 — Withdrawal history table
- [x] History displays withdrawal records returned by the selected adapter.
- [x] Lists show Date, Investment and signed Amount; investment-specific lists omit Investment. Notice status remains internal.
- [x] Newly submitted requests appear in the history.
- [x] Empty states are handled.

### MF-04 — CSV download button
- [x] Download button exists above the filters.
- [ ] Button calls the backend export API.
- [x] Product and date filters are respected; superseded responses cannot change current results or enable an outdated download.
- [x] Browser downloads a valid CSV file with Date, Investment and negative Amount columns.

## C. Mandatory business rules

### BR-01 — Retirement age
- [ ] Retirement withdrawal is rejected when investor age is 65.
- [ ] Retirement withdrawal is rejected when investor age is below 65.
- [ ] Retirement withdrawal is eligible when investor age is greater than 65, assuming other rules pass.

### BR-02 — Available balance
- [ ] Withdrawal exceeding the available balance is rejected.
- [ ] Failed requests do not alter the available balance.

### BR-03 — 90% withdrawal restriction
- [ ] Withdrawal above the applicable 90% limit is rejected.
- [ ] Withdrawal at exactly the permitted maximum is accepted, assuming other rules pass.

**Confirmed policy:** Apply 90% to the remaining available balance on each request,
round down to cents, and require at least R100. Return a maximum of R0 when no
request meets both limits; retain the actual balance. There is no closing exception.
The frontend/mock implementation is verified by `mock-api.spec.ts` and the browser
suite. Backend verification remains pending. See [business rules](business-rules.md).

### BR-04 — Error handling and user feedback
- [ ] Invalid requests produce meaningful API errors.
- [ ] Frontend displays clear and helpful error messages.
- [ ] Failed requests do not appear as successful.

## D. Advanced requirements

### ADV-01 — Global exception handling
- [ ] Centralized Spring Boot exception handler exists.
- [ ] Business-rule failures return appropriate HTTP errors.
- [ ] Missing resources and unexpected errors are handled.
- [ ] Internal stack traces are not exposed to users.

### ADV-02 — DTO layer
- [ ] API request DTOs exist.
- [ ] API response DTOs exist.
- [ ] Database entities are not returned directly from controllers.
- [ ] Mapping between entities and DTOs is understandable.

### ADV-03 — Input validation
- [ ] Required inputs are validated.
- [ ] Missing, negative and invalid amounts are rejected.
- [ ] Malformed requests return meaningful responses.
- [ ] Server-side validation cannot be bypassed by manipulating the UI.

### ADV-04 — Unit tests
- [ ] Business-rule tests exist.
- [ ] Age boundary tests pass.
- [ ] Balance-limit tests pass.
- [ ] 90% limit tests pass.
- [ ] Valid withdrawal tests pass.
- [ ] Invalid withdrawal tests pass.

### ADV-05 — UI validation
- [x] Form validates user input.
- [x] Error messages appear near the relevant input.
- [x] Invalid submissions are prevented where possible.
- [ ] Backend errors are also displayed correctly.
- [x] Submitting state prevents duplicate clicks.

HTTP error feedback and retry are verified with fixtures. The unchecked backend-error
item still requires a live integration check.

## E. Technical and delivery guidelines

- [ ] Backend uses Spring Boot.
- [ ] Database uses H2.
- [ ] Java package follows `com.enviro.assessment.junior.yourname`.
- [ ] APIs follow REST best practices.
- [ ] Frontend communicates with actual backend APIs.
- [ ] GitHub repository includes backend and frontend.
- [x] README includes frontend setup, verified with a clean `npm ci` installation.
- [ ] README includes API documentation.
- [x] README includes current frontend screenshots.
- [x] README discloses AI tool usage.
- [ ] I can explain all AI-assisted code.
- [ ] Application can be started and tested using README instructions.
