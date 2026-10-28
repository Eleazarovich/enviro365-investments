# Enviro365 Investments — Implementation & QA Checklist

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
- [ ] Dashboard displays investor portfolio data.
- [ ] Investment products are displayed.
- [ ] Overall available balance is accurate.
- [ ] Investor can open individual investment details.
- [ ] Data is retrieved from the Spring Boot API in the integrated version.

### MF-02 — Withdrawal form
- [ ] User can enter a withdrawal amount.
- [ ] User can submit a request.
- [ ] User receives clear feedback for invalid requests.
- [ ] Successful submission updates the displayed balance.
- [ ] Request is sent to the actual backend API.

### MF-03 — Withdrawal history table
- [ ] History displays saved withdrawal records.
- [ ] Each record shows the relevant investment, date, amount and status.
- [ ] Newly submitted requests appear in the history.
- [ ] Empty states are handled.

### MF-04 — CSV download button
- [ ] Download button exists.
- [ ] Button calls the backend export API.
- [ ] Applied filters are respected.
- [ ] Browser downloads a valid CSV file.

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
- [ ] Form validates user input.
- [ ] Error messages appear near the relevant input.
- [ ] Invalid submissions are prevented where possible.
- [ ] Backend errors are also displayed correctly.
- [ ] Submitting state prevents duplicate clicks.

## E. Technical and delivery guidelines

- [ ] Backend uses Spring Boot.
- [ ] Database uses H2.
- [ ] Java package follows `com.enviro.assessment.junior.yourname`.
- [ ] APIs follow REST best practices.
- [ ] Frontend communicates with actual backend APIs.
- [ ] GitHub repository includes backend and frontend.
- [ ] README includes project setup.
- [ ] README includes API documentation.
- [ ] README includes screenshots.
- [ ] README discloses AI tool usage.
- [ ] I can explain all AI-assisted code.
- [ ] Application can be started and tested using README instructions.